import { browser } from 'webextension-polyfill-ts';
import type { Runtime } from 'webextension-polyfill-ts';
import debounce from 'lodash.debounce';
import { getStorage, hookStorage } from 'chrome-utils';
import {
  MessageType,
  BADGE_PURPLE_BACKGROUND_COLOR,
  BADGE_DEFAULT_BACKGROUND_COLOR,
} from 'app-constants';
import { AccountType, Channel, ChannelType, LiveChannel, TwitchLogin, YouTubeApiKey } from 'types';
import { error } from 'logging';
import { getChannelUrl, getFavoriteId, getHiddenChannelsKey, sortChannels } from 'utils';
import { openTwitchTabs } from '../tabs';
import { fetchTwitchData, handleError as handleTwitchError } from './twitch';
import { fetchYouTubeData } from './youtube';

let globalChannels: Channel[] = [];
let popupPort: Runtime.Port | null = null;

async function getSortedLiveChannels(channels: Channel[]): Promise<LiveChannel[]> {
  const { hiddenChannels, favorites = [] } = await getStorage(['notifications', 'hiddenChannels', 'favorites']);
  return channels
    .filter(channel => !(channel.type === ChannelType.TWITCH
      && hiddenChannels?.twitch.map(username => username.toLowerCase()).includes(getHiddenChannelsKey(channel))))
    .filter((channel): channel is LiveChannel => channel.viewerCount != null && favorites.includes(getFavoriteId(channel)))
    .sort((a, b) => sortChannels(a, b, favorites));
}

browser.notifications.onClicked.addListener((favoriteId: string) => {
  const clickedChannel = globalChannels.find(channel => favoriteId === getFavoriteId(channel));
  if (clickedChannel) {
    browser.tabs.create({
      url: getChannelUrl(clickedChannel),
      active: true,
    });
  }
});

async function notify(channelsBefore: Channel[], channelsAfter: Channel[]): Promise<void> {
  const { notifications } = await getStorage(['notifications']);
  if (notifications) {
    const oldLiveChannels = await getSortedLiveChannels(channelsBefore);
    const newLiveChannels = await getSortedLiveChannels(channelsAfter);
    const topChannel = newLiveChannels[0];
    if (topChannel && (!oldLiveChannels[0] || getFavoriteId(topChannel) !== getFavoriteId(oldLiveChannels[0]))) {
      await browser.notifications.create(getFavoriteId(topChannel), {
        title: `${topChannel.displayName} is live!`,
        message: 'Click to view their stream.',
        type: 'basic',
        iconUrl: 'icons/icon128.png',
      });
    }
  }
}

async function refreshBadgeData(): Promise<void> {
  const { favorites, hiddenChannels } = await getStorage(['favorites', 'hiddenChannels']);
  const filteredChannels = globalChannels.filter(channel => {
    const isHiddenTwitch = channel.type === ChannelType.TWITCH
      && hiddenChannels?.twitch.map(c => c.toLowerCase()).includes(channel.username.toLowerCase());
    const isHiddenYouTube = channel.type === ChannelType.YOUTUBE
      && hiddenChannels?.youtube.includes(channel.manualInputQuery.toLowerCase());
    return !isHiddenTwitch && !isHiddenYouTube;
  });
  const isAnyFavoriteLive = filteredChannels.some(channel => channel.viewerCount != null && favorites?.includes(getFavoriteId(channel)));
  const numStreamsLive = filteredChannels.reduce(
    (acc, channel) => acc + (channel.viewerCount != null ? 1 : 0),
    0,
  );
  await browser.browserAction.setBadgeText({ text: String(numStreamsLive) });
  await browser.browserAction.setBadgeBackgroundColor({
    color: isAnyFavoriteLive ? BADGE_PURPLE_BACKGROUND_COLOR : BADGE_DEFAULT_BACKGROUND_COLOR,
  });
}

async function setChannels(channels: Channel[]) {
  await notify(globalChannels, channels);
  globalChannels = channels;
  popupPort?.postMessage({
    type: MessageType.SEND_CHANNELS,
    data: globalChannels,
  });
  refreshBadgeData();
}

async function fetchData() {
  const { logins, addedChannels } = await getStorage([
    'logins',
    'addedChannels',
  ]);
  const twitchLogin = logins?.find(l => l.type === AccountType.TWITCH) as TwitchLogin | undefined;
  const youtubeLogin = logins?.find(l => l.type === AccountType.YOUTUBE_API_KEY) as YouTubeApiKey | undefined;
  const newChannels: Channel[] = [];
  if (twitchLogin) {
    try {
      const twitchChannels = await fetchTwitchData(
        twitchLogin.accessToken,
        twitchLogin.userId,
        addedChannels?.twitch || [],
      );
      newChannels.push(...twitchChannels);
    } catch (err) {
      handleTwitchError(err);
    }
  }
  // TODO: Suport auto opening tabs with YouTube
  getStorage([{
    key: 'autoOpenTabs',
    cb: autoOpenTabs => {
      if (autoOpenTabs) openTwitchTabs(globalChannels);
    },
  }]);
  if (youtubeLogin) {
    try {
      const youTubeChannels = await fetchYouTubeData(youtubeLogin.apiKey, addedChannels?.youtube || []);
      newChannels.push(...youTubeChannels);
    } catch (err) {
      // TODO: Handle this
      error(err);
    }
  }
  setChannels(newChannels);
}

let pollingInterval: NodeJS.Timeout | undefined;
async function poll() {
  const { logins, enabled, pollDelay } = await getStorage([
    'logins',
    'enabled',
    'pollDelay',
  ]);
  if (pollingInterval) clearInterval(pollingInterval);
  if (enabled && logins && logins.length > 0) {
    fetchData();
    pollingInterval = setInterval(fetchData, Number(pollDelay) * 1000 * 60);
  } else {
    setChannels([]);
  }
}
const debouncedPoll = debounce(poll, 3000);

function initHooks() {
  hookStorage([
    {
      key: 'logins',
      cb: debouncedPoll,
    },
    {
      key: 'pollDelay',
      cb: debouncedPoll,
    },
    {
      key: 'addedChannels',
      cb: debouncedPoll,
    },
  ]);

  hookStorage([{
    key: 'enabled',
    cb: enabled => {
      if (!enabled) {
        if (pollingInterval) clearInterval(pollingInterval);
        setChannels([]);
      } else if (pollingInterval) {
        poll();
      }
    },
  }]);

  hookStorage([
    {
      key: 'favorites',
      cb: refreshBadgeData,
    },
    {
      key: 'hiddenChannels',
      cb: refreshBadgeData,
    },
  ]);
}

function listen() {
  browser.runtime.onConnect.addListener(port => {
    popupPort = port;
    port.onMessage.addListener(msg => {
      switch (msg.type) {
        case MessageType.FETCH_CHANNELS: {
          port.postMessage({
            type: MessageType.SEND_CHANNELS,
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
