import { browser } from 'webextension-polyfill-ts';
import type { Runtime } from 'webextension-polyfill-ts';
import chunk from 'lodash.chunk';
import debounce from 'lodash.debounce';
import { log } from 'logging';
import { getStorage, hookStorage } from '../../src/chrome-utils';
import {
  TWITCH_API_BASE,
  CLIENT_ID,
  PAGINATION_LIMIT,
  MESSAGE_TYPES,
  BADGE_PURPLE_BACKGROUND_COLOR,
  BADGE_DEFAULT_BACKGROUND_COLOR,
} from '../../src/app-constants';
import type { Channel } from '../../src/types';
import { openTwitchTabs } from './tabs';
import { logout } from './auth';

let globalChannels: Channel[] = [];
let popupPort: Runtime.Port | null = null;

function setChannels(channels: Channel[]) {
  globalChannels = channels;
  popupPort?.postMessage({
    type: MESSAGE_TYPES.SEND_CHANNELS,
    data: globalChannels,
  });
}

const getApi = (accessToken: string) => async (route: string, params: [string, string | number][]) => {
  const url = new URL(`${TWITCH_API_BASE}${route}`);
  params.forEach(([key, value]) => {
    if (value) url.searchParams.append(key, String(value));
  });
  const res = await fetch(url.href, {
    method: 'GET',
    headers: {
      'Client-ID': CLIENT_ID,
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
    const res = await getApi(accessToken)('/users/follows', [
      ['from_id', userId],
      ['first', PAGINATION_LIMIT],
      ['after', cursor],
    ]);
    cursor = res.pagination.cursor;
    channels.push(...res.data);
  } while (cursor);
  return channels;
}

async function updateBadgeColor(favorites: string[]): Promise<void> {
  const isAnyFavoriteLive = globalChannels.some(channel => channel.viewerCount != null && favorites.includes(channel.username));
  await browser.browserAction.setBadgeBackgroundColor({
    color: isAnyFavoriteLive ? BADGE_PURPLE_BACKGROUND_COLOR : BADGE_DEFAULT_BACKGROUND_COLOR,
  });
}

async function fetchLiveStreams(accessToken: string, userId: string) {
  const streams = [];
  let cursor = '';
  do {
    const res = await getApi(accessToken)('/streams/followed', [
      ['user_id', userId],
      ['first', PAGINATION_LIMIT],
      ['after', cursor],
    ]);
    cursor = res.pagination.cursor;
    streams.push(...res.data);
  } while (cursor);
  await browser.browserAction.setBadgeText({ text: String(streams.length) });
  return streams;
}

async function fetchTwitchData(accessToken: string, userId: string) {
  const [channels, streams] = await Promise.all([
    fetchFollowing(accessToken, userId),
    fetchLiveStreams(accessToken, userId),
  ]);

  const usersDatas = await Promise.all(chunk(channels, 100).map(async channelsChunk => {
    const url = new URL(`${TWITCH_API_BASE}/users`);
    channelsChunk.forEach(channel => {
      url.searchParams.append('id', channel.to_id);
    });
    const res = await getApi(accessToken)('/users', channelsChunk.map(channel => ['id', channel.to_id]));
    return res.data;
  }));
  const usersData = usersDatas.flat();

  setChannels(channels.map(channelRes => {
    const stream = streams.find((item: any) => {
      return item.user_id === channelRes.to_id;
    });
    const userData = usersData.find((item: any) => {
      return item.id === channelRes.to_id;
    });
    const channel: Channel = {
      username: channelRes.to_login.toLowerCase(),
      displayName: channelRes.to_name,
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
  }));

  getStorage([{
    key: 'autoOpenTabs',
    cb: autoOpenTabs => {
      if (autoOpenTabs) openTwitchTabs(globalChannels);
    },
  }, {
    key: 'favorites',
    cb: favorites => updateBadgeColor(favorites as string[]),
  }]);
}

function handleError(err: unknown) {
  if (typeof err === 'object'
    && err
    && 'status' in err
    && typeof err.status === 'number'
    && [400, 401].includes(err.status)
  ) {
    // Access token is probably invalid
    log('Logged out due to (assumed) invalid access token', err);
    logout();
  } else {
    throw err;
  }
}

let pollingInterval: NodeJS.Timeout | undefined;
async function poll() {
  const { accessToken, userId, enabled, pollDelay } = await getStorage(['accessToken', 'userId', 'enabled', 'pollDelay']);
  if (pollingInterval) clearInterval(pollingInterval);
  if (accessToken && userId && enabled && pollDelay) {
    fetchTwitchData(accessToken, userId).catch(handleError);
    pollingInterval = setInterval(() => {
      fetchTwitchData(accessToken, userId).catch(handleError);
    }, Number(pollDelay) * 1000 * 60);
  }
}
const debouncedPoll = debounce(poll, 3000);

function initHooks() {
  hookStorage((['accessToken', 'userId'] as const).map(key => ({
    key,
    cb: poll,
  })));

  hookStorage([{
    key: 'pollDelay',
    cb: debouncedPoll,
  }]);

  hookStorage([{
    key: 'enabled',
    cb: enabled => {
      if (!enabled) {
        if (pollingInterval) clearInterval(pollingInterval);
        setChannels([]);
        browser.browserAction.setBadgeText({ text: '' });
      } else if (pollingInterval) {
        poll();
      }
    },
  }]);

  hookStorage([{
    key: 'favorites',
    cb: favorites => updateBadgeColor(favorites as string[]),
  }]);
}

function listen() {
  browser.runtime.onConnect.addListener(port => {
    popupPort = port;
    port.onMessage.addListener(msg => {
      switch (msg.type) {
        case MESSAGE_TYPES.FETCH_CHANNELS: {
          port.postMessage({
            type: MESSAGE_TYPES.SEND_CHANNELS,
            data: globalChannels,
          });
          break;
        }
        default: {
          break;
        }
      }
    });
    port.onDisconnect.addListener(() => {
      popupPort = null;
    });
  });
}

export default function initPolling() {
  listen();
  initHooks();
  poll();
}
