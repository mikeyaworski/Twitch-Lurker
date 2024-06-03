import browser from 'webextension-polyfill';
import get from 'lodash.get';
import {
  YOUTUBE_API_BASE,
  YOUTUBE_PAGINATION_LIMIT,
  YOUTUBE_SUBSCRIPTIONS_POLL_DELAY_SECONDS,
  GOOGLE_CLIENT_ID,
} from 'src/app-constants';
import { error, log } from 'src/logging';
import {
  AccountType,
  ChannelType,
  IntentionalAny,
  LiveYouTubeChannel,
  StorageType,
  YouTubeChannel,
  YouTubeLogin,
  YouTubeSubscription,
} from 'src/types';
import { notEmpty } from 'src/utils';
import { setStorage } from 'src/chrome-utils';
import { waitFullStorage } from 'src/storage';
import { tryRefreshToken } from '../auth/youtube';
import { logout } from '../auth';

type GetApiOptions = {
  apiKey: string,
} | {
  clientId: string,
  accessToken: string,
};

type Api = (route: string, params: [string, string | number][]) => Promise<IntentionalAny>;

const getApi = (options: GetApiOptions) => async (route: string, params: [string, string | number][]) => {
  const url = new URL(`${YOUTUBE_API_BASE}${route}`);
  params.forEach(([key, value]) => {
    if (value) url.searchParams.append(key, String(value));
  });
  const headers: HeadersInit = {};
  if ('apiKey' in options) headers['X-GOOG-API-KEY'] = options.apiKey;
  if ('clientId' in options) headers['Client-ID'] = options.clientId;
  if ('accessToken' in options) headers.Authorization = `Bearer ${options.accessToken}`;
  const res = await fetch(url.href, {
    method: 'GET',
    headers,
  });
  const json = await res.json();
  if (res.status >= 400) throw json;
  return json;
};

const channelInfoCache = new Map<string, YouTubeChannel>();

export type FetchYouTubeDataOptions = ({
  accessToken: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  expiry: number,
} | {
  apiKey: string,
}) & {
  addedChannels: string[],
};

export async function fetchYouTubeData(options: FetchYouTubeDataOptions): Promise<YouTubeChannel[]> {
  let fetch: Api;
  const { addedChannels } = options;
  if ('accessToken' in options) {
    const refreshedData = await tryRefreshToken({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      accessToken: options.accessToken,
      refreshToken: options.refreshToken,
      expiry: options.expiry,
    });
    fetch = getApi({ clientId: options.clientId, accessToken: refreshedData.accessToken });
  } else {
    fetch = getApi({ apiKey: options.apiKey });
  }
  const baseChannels: (YouTubeChannel | null)[] = await Promise.all(addedChannels.map(async addedChannel => {
    if (channelInfoCache.has(addedChannel)) {
      return channelInfoCache.get(addedChannel)!;
    }
    let channelRes = await fetch('/channels', [
      ['part', 'snippet,id,contentDetails'],
      ['forUsername', addedChannel],
    ]);
    if (!channelRes.items) {
      channelRes = await fetch('/channels', [
        ['part', 'snippet,id,contentDetails'],
        ['id', addedChannel],
      ]);
    }
    const item = channelRes.items?.[0];
    if (!item) return null;
    const id: string | undefined = item.id;
    const uploadsPlaylist: string | undefined = item.contentDetails?.relatedPlaylists?.uploads;
    const displayName: string | undefined = item.snippet?.title;
    const customUrl: string | undefined = item.snippet?.customUrl;
    const profilePic: string | undefined = item.snippet?.thumbnails?.default?.url;
    if (!uploadsPlaylist || !id || !customUrl || !displayName) return null;
    const channel: YouTubeChannel = {
      type: ChannelType.YOUTUBE,
      id,
      manualInputQuery: addedChannel,
      uploadsPlaylist,
      customUrl,
      displayName,
      profilePic,
    };
    channelInfoCache.set(addedChannel, channel);
    return channel;
  }));
  const filteredChannels = baseChannels.filter(notEmpty);
  const videoIds: string[][] = await Promise.all(filteredChannels.map(async channel => {
    if (!channel.uploadsPlaylist) return [];
    try {
      const recentVidsRes = await fetch('/playlistItems', [
        ['part', 'snippet,contentDetails'],
        ['playlistId', channel.uploadsPlaylist],
        // We need to check a lot of videos since any videos uploaded to the channel after the livestream has started will offset the livestream
        // from the end of the results. E.g. esports streams that are live for 11 hours may have uploaded a bunch of clips or player interviews
        // since the stream started.
        ['maxResults', YOUTUBE_PAGINATION_LIMIT],
      ]);
      return recentVidsRes.items
        // This filter is extremely flakey, but this prevents us from having to request so many video IDs
        ?.filter((item: IntentionalAny) => get(item, 'snippet.thumbnails.default.url', '').includes('default_live'))
        .map((item: IntentionalAny) => item.contentDetails?.videoId)
        .filter(notEmpty);
    } catch (err) {
      // 404 is fine for channels that have no uploads (e.g. livestream only channels but is not currently live)
      if (get(err, 'error.code') !== 404) {
        throw err;
      }
    }
    return [];
  }));
  const videoIdsList = videoIds.flat().join(',');
  // Pagination is not required here
  const vidsRes = videoIdsList ? await fetch('/videos', [
    ['part', 'snippet,id,liveStreamingDetails'],
    ['id', videoIdsList],
  ]) : { items: [] };
  const channels: (YouTubeChannel | LiveYouTubeChannel)[][] = filteredChannels.map(channel => {
    try {
      const livestreams: IntentionalAny[] = vidsRes.items?.filter((item: IntentionalAny) => item.snippet?.channelId === channel.id
        && item.snippet?.liveBroadcastContent === 'live')
        ?? [];
      const liveChannels: LiveYouTubeChannel[] = livestreams.map(livestream => {
        const viewerCount = Number(get(livestream, 'liveStreamingDetails.concurrentViewers', '0'));
        const thumbnail: string = get(livestream, 'snippet.thumbnails.high.url', get(livestream, 'snippet.thumbnails.default.url'));
        const start: string = get(livestream, 'liveStreamingDetails.actualStartTime');
        const title: string = get(livestream, 'snippet.title');
        const videoId: string = livestream.id;
        const liveChannel: LiveYouTubeChannel = {
          ...channel,
          viewerCount,
          thumbnail,
          start,
          title,
          videoId,
        };
        return liveChannel;
      });
      if (liveChannels.length > 0) return liveChannels;
      return [channel];
    } catch (err) {
      error(err);
      return [channel];
    }
  });
  return channels.flat();
}

export async function fetchYouTubeSubscriptions(login: YouTubeLogin) {
  const clientId = login.clientId || GOOGLE_CLIENT_ID;
  const refreshedData = await tryRefreshToken({
    clientId,
    clientSecret: login.clientSecret,
    accessToken: login.accessToken,
    refreshToken: login.refreshToken,
    expiry: login.expiry,
  });
  const fetch = getApi({
    accessToken: refreshedData.accessToken,
    clientId,
  });
  const subscriptions: YouTubeSubscription[] = [];
  let pageToken;
  do {
    const res = await fetch('/subscriptions', [
      ['part', 'snippet,contentDetails'],
      ['mine', 'true'],
      ['maxResults', YOUTUBE_PAGINATION_LIMIT],
      ['pageToken', pageToken],
    ]);
    if (res.items) {
      subscriptions.push(...(res.items as IntentionalAny[]).map((item: IntentionalAny) => {
        const channelId = get<string>(item, 'snippet.resourceId.channelId', '');
        const displayName = get<string>(item, 'snippet.title', '');
        if (channelId && displayName) {
          return {
            channelId,
            displayName,
          };
        }
        return null;
      }).filter(notEmpty));
    }
    pageToken = res.nextPageToken;
  } while (pageToken);
  setStorage({
    youtubeSubscriptions: {
      fetchTime: Date.now() / 1000,
      subscriptions,
    },
  }, StorageType.LOCAL);
  return subscriptions;
}

export async function tryPollYouTubeSubscriptions(login: YouTubeLogin): Promise<YouTubeSubscription[]| null> {
  const storageLocal = await waitFullStorage(StorageType.LOCAL);
  const fetchTime = storageLocal.youtubeSubscriptions?.fetchTime;
  if (fetchTime == null || (Date.now() / 1000 - fetchTime) > YOUTUBE_SUBSCRIPTIONS_POLL_DELAY_SECONDS) {
    return fetchYouTubeSubscriptions(login);
  }
  return null;
}

export function handleError(err: unknown): void {
  error(err);
  const status: string | undefined = get(err, 'error.status');
  if (status && ['UNAUTHENTICATED', 'PERMISSION_DENIED'].includes(status)) {
    log('Logged out of YouTube account due to (assumed) invalid access token');
    logout(AccountType.YOUTUBE);
    browser.notifications.create('youtube-logged-out', {
      title: 'YouTube needs to be reauthenticated',
      message: 'Your authentication token was likely revoked. You need to log into YouTube again.',
      type: 'basic',
      iconUrl: 'icons/icon128.png',
    });
  }
}
