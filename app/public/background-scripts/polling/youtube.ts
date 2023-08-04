import get from 'lodash.get';
import {
  GOOGLE_API_BASE,
} from 'app-constants';
import { error } from 'logging';
import { Channel, ChannelType, IntentionalAny, LiveYouTubeChannel, YouTubeChannel } from 'types';
import { notEmpty } from 'utils';

const getApi = (apiKey: string) => async (route: string, params: [string, string | number][]) => {
  const url = new URL(`${GOOGLE_API_BASE}${route}`);
  params.forEach(([key, value]) => {
    if (value) url.searchParams.append(key, String(value));
  });
  const res = await fetch(url.href, {
    method: 'GET',
    headers: {
      'X-GOOG-API-KEY': apiKey,
    },
  });
  const json = await res.json();
  if (res.status >= 400) throw json;
  return json;
};

const channelInfoCache = new Map<string, YouTubeChannel>();

export async function fetchYouTubeData(apiKey: string, addedChannels: string[]): Promise<YouTubeChannel[]> {
  const fetch = getApi(apiKey);
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
        ['maxResults', 50],
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
