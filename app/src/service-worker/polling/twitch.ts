import chunk from 'lodash.chunk';
import {
  TWITCH_API_BASE,
  TWITCH_CLIENT_ID,
  TWITCH_PAGINATION_LIMIT,
} from 'src/app-constants';
import { error, log } from 'src/logging';
import { AccountType, ChannelType, IntentionalAny, TwitchChannel } from 'src/types';
import { logout } from '../auth';

const getApi = (accessToken: string) => async (route: string, params: [string, string | number][]) => {
  const url = new URL(`${TWITCH_API_BASE}${route}`);
  params.forEach(([key, value]) => {
    if (value) url.searchParams.append(key, String(value));
  });
  const res = await fetch(url.href, {
    method: 'GET',
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await res.json();
  if (res.status >= 400) throw json;
  return json;
};

async function fetchFollowing(accessToken: string, userId: string) {
  let cursor = '';
  const channels = [];
  do {
    const res = await getApi(accessToken)('/channels/followed', [
      ['user_id', userId],
      ['first', TWITCH_PAGINATION_LIMIT],
      ['after', cursor],
    ]);
    cursor = res.pagination.cursor;
    channels.push(...res.data);
  } while (cursor);
  return channels;
}

async function fetchFollowedLiveStreams(accessToken: string, userId: string) {
  const streams = [];
  let cursor = '';
  do {
    const res = await getApi(accessToken)('/streams/followed', [
      ['user_id', userId],
      ['first', TWITCH_PAGINATION_LIMIT],
      ['after', cursor],
    ]);
    cursor = res.pagination.cursor;
    streams.push(...res.data);
  } while (cursor);
  return streams;
}

async function fetchArbitraryLiveStreams(accessToken: string, channels: string[]) {
  const streams: unknown[] = [];
  let cursor = '';
  await Promise.all(chunk(channels, TWITCH_PAGINATION_LIMIT).map(async channelsChunk => {
    do {
      const res = await getApi(accessToken)('/streams', [
        ...channelsChunk.map(username => ['user_login', username] as [string, string]),
        ['first', TWITCH_PAGINATION_LIMIT],
        ['after', cursor],
      ]);
      cursor = res.pagination.cursor;
      streams.push(...res.data);
    } while (cursor);
  }));
  return streams;
}

async function fetchLiveStreams(accessToken: string, userId: string, addedChanels: string[]) {
  const [followedStreams, addedStreams] = await Promise.all([
    fetchFollowedLiveStreams(accessToken, userId),
    fetchArbitraryLiveStreams(accessToken, addedChanels),
  ]);
  return [...followedStreams, ...addedStreams];
}

export async function fetchTwitchData(accessToken: string, userId: string, addedChanels: string[]): Promise<TwitchChannel[]> {
  const [channels, streams] = await Promise.all([
    fetchFollowing(accessToken, userId),
    fetchLiveStreams(accessToken, userId, addedChanels),
  ]);

  // Filter out added channels which are duplicates (already followed)
  const followedChannelUsernames = new Set<string>(channels.map(channel => channel.broadcaster_login.toLowerCase()));
  const filteredAddedChannels = addedChanels.filter(username => !followedChannelUsernames.has(username.toLowerCase()));

  const channelParamData = [
    ...channels.map(channel => ['id', channel.broadcaster_id] as [string, string]),
    ...filteredAddedChannels.map(username => ['login', username] as [string, string]),
  ];
  const usersDatas = await Promise.all(chunk(channelParamData, TWITCH_PAGINATION_LIMIT).map(async paramDataChunk => {
    const res = await getApi(accessToken)('/users', paramDataChunk);
    return res.data;
  }));
  const usersData = usersDatas.flat();

  return usersData.map(userData => {
    const stream = streams.find((item: IntentionalAny) => {
      return item.user_id === userData.id;
    });
    const channel: TwitchChannel = {
      type: ChannelType.TWITCH,
      username: userData.login.toLowerCase(),
      displayName: userData.display_name,
    };
    if (stream) {
      channel.displayName = stream.user_name;
      channel.viewerCount = stream.viewer_count;
      channel.game = stream.game_name;
      channel.thumbnail = stream.thumbnail_url;
      channel.start = stream.started_at;
    }
    if (userData) {
      channel.displayName = userData.display_name;
      channel.profilePic = userData.profile_image_url;
    }
    return channel;
  });
}

export function handleError(err: unknown) {
  if (typeof err === 'object'
    && err
    && 'status' in err
    && typeof err.status === 'number'
    && [400, 401].includes(err.status)
  ) {
    // Access token is probably invalid
    error(err);
    log('Logged out of Twitch account due to (assumed) invalid access token');
    logout(AccountType.TWITCH);
  } else {
    throw err;
  }
}
