import browser from 'webextension-polyfill';
import chunk from 'lodash.chunk';
import {
  TWITCH_API_BASE,
  TWITCH_CLIENT_ID,
  TWITCH_PAGINATION_LIMIT,
  TWITCH_USERNAME_REGEX,
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
  await Promise.all(chunk(channels, TWITCH_PAGINATION_LIMIT).map(async channelsChunk => {
    let cursor = '';
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
    // This request depends on user input, so errors are reasonably expected.
    // Instead of letting the error propagate up the call stack, we should just catch and log the error so the user can find information about it.
    // This prevents the error from logging the user out due to an HTTP 400 or something like that.
    fetchArbitraryLiveStreams(accessToken, addedChanels).catch(err => {
      error(err);
      return [];
    }),
  ]);
  return [...followedStreams, ...addedStreams];
}

async function fetchUsers(accessToken: string, channelParams: [string, string][]): Promise<IntentionalAny[]> {
  return Promise.all(chunk(channelParams, TWITCH_PAGINATION_LIMIT).map(async paramDataChunk => {
    const res = await getApi(accessToken)('/users', paramDataChunk);
    return res.data;
  }));
}

export async function fetchTwitchData(accessToken: string, userId: string, addedChanels: string[]): Promise<TwitchChannel[]> {
  const validAddedChannels = addedChanels.filter(username => TWITCH_USERNAME_REGEX.test(username));
  const invalidAddedChannels = addedChanels.filter(username => !TWITCH_USERNAME_REGEX.test(username));
  if (invalidAddedChannels.length > 0) {
    error('You have invalid Twitch usernames in your added channels list. They will be ignored:', invalidAddedChannels);
  }

  const [channels, streams] = await Promise.all([
    fetchFollowing(accessToken, userId),
    fetchLiveStreams(accessToken, userId, validAddedChannels),
  ]);

  // Filter out added channels which are duplicates (already followed)
  const followedChannelUsernames = new Set<string>(channels.map(channel => channel.broadcaster_login.toLowerCase()));
  const filteredAddedChannels = validAddedChannels.filter(username => !followedChannelUsernames.has(username.toLowerCase()));

  const channelParamDataWithoutAddedChannels = channels.map(channel => ['id', channel.broadcaster_id] as [string, string]);
  const channelParamData = [
    ...channelParamDataWithoutAddedChannels,
    ...filteredAddedChannels.map(username => ['login', username] as [string, string]),
  ];
  const usersDatas = await fetchUsers(accessToken, channelParamData).catch(err => {
    // Fall back to requesting just the followed channels without added channels,
    // since the added channels contain user input that may result in an invalid request.
    error(err);
    return fetchUsers(accessToken, channelParamDataWithoutAddedChannels);
  });
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
      channel.title = stream.title;
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
    const message: string | null = 'message' in err && typeof err.message === 'string' ? err.message : null;
    // TODO: Once I find out the transient 400 error message for an invalid access token, use that as an affirmative signal to log out,
    // rather than use negative signals to not log out.
    // This is more likely to bother users by logging them out after an unknown error is encountered.
    // Current knowledge is: {"error":"Unauthorized","status":401,"message":"Invalid OAuth token"}
    const dontLogOut = message && [
      'Malformed query params.',
      'Invalid username(s), email(s), or ID(s). Bad Identifiers.',
    ].includes(message);
    if (dontLogOut) return;
    log('Logged out of Twitch account due to (assumed) invalid access token');
    logout(AccountType.TWITCH);
    browser.notifications.create('twitch-logged-out', {
      title: 'Twitch needs to be reauthenticated',
      message: 'Your authentication token was likely revoked. You need to log into Twitch again.',
      type: 'basic',
      iconUrl: 'icons/icon128.png',
    });
  } else {
    throw err;
  }
}
