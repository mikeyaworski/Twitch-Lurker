import { browser } from 'webextension-polyfill-ts';
import type { Runtime } from 'webextension-polyfill-ts';
import debounce from 'lodash.debounce';
import { hookStorage } from 'chrome-utils';
import {
  MessageType,
  BADGE_PURPLE_BACKGROUND_COLOR,
  BADGE_DEFAULT_BACKGROUND_COLOR,
} from 'app-constants';
import { getFullStorage, waitFullStorage } from 'storage';
import { AccountType, Channel, ChannelType, LiveChannel, TwitchLogin, YouTubeApiKey, StorageType } from 'types';
import { error, log } from 'logging';
import { getChannelUrl, getFavoriteId, getHiddenChannelsKey, getIsLoggedInWithAnyAccount, getYouTubeLogin, sortChannels } from 'utils';
import { openTwitchTabs } from '../tabs';
import { fetchTwitchData, handleError as handleTwitchError } from './twitch';
import {
  FetchYouTubeDataOptions,
  fetchYouTubeData,
  fetchYouTubeSubscriptions,
  tryPollYouTubeSubscriptions,
  handleError as handleYouTubeError,
} from './youtube';

const storage = getFullStorage();

let globalChannels: Channel[] = [];
let popupPort: Runtime.Port | null = null;

function getSortedLiveChannels(channels: Channel[]): LiveChannel[] {
  const { hiddenChannels, favorites } = storage;
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
  const { notifications } = storage;
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
  const { favorites, hiddenChannels } = storage;
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
  const { logins, addedChannels, autoOpenTabs } = storage;
  const twitchLogin = logins?.find((l): l is TwitchLogin => l.type === AccountType.TWITCH);
  const youtubeApiKey = logins?.find((l): l is YouTubeApiKey => l.type === AccountType.YOUTUBE_API_KEY);
  let youtubeLogin = getYouTubeLogin(storage);
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
  // TODO: Support auto opening tabs with YouTube
  if (youtubeApiKey || youtubeLogin) {
    try {
      // Only use the accessToken to fetch data if it comes from a custom app
      const options: FetchYouTubeDataOptions | null = youtubeLogin?.clientId && youtubeLogin?.clientSecret ? {
        accessToken: youtubeLogin.accessToken,
        refreshToken: youtubeLogin.refreshToken,
        clientId: youtubeLogin.clientId,
        clientSecret: youtubeLogin.clientSecret,
        expiry: youtubeLogin.expiry,
        addedChannels: addedChannels?.youtube || [],
      } : youtubeApiKey ? {
        apiKey: youtubeApiKey?.apiKey,
        addedChannels: addedChannels?.youtube || [],
      } : null;
      if (options) {
        try {
          const youTubeChannels = await fetchYouTubeData(options);
          newChannels.push(...youTubeChannels);
        } catch (err) {
          error(err);
          // Use apiKey as backup if possible
          if (youtubeApiKey && 'accessToken' in options) {
            log('Using YouTube API Key as fallback');
            const youTubeChannels = await fetchYouTubeData({
              apiKey: youtubeApiKey.apiKey,
              addedChannels: options.addedChannels,
            });
            newChannels.push(...youTubeChannels);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      handleYouTubeError(err);
    }
  }
  setChannels(newChannels);
  youtubeLogin = getYouTubeLogin(storage); // get the login again because the accessToken and expiry may have been updated
  if (youtubeLogin) tryPollYouTubeSubscriptions(youtubeLogin)?.catch(error);
  if (autoOpenTabs) openTwitchTabs(globalChannels);
}

let pollingInterval: NodeJS.Timeout | undefined;
async function poll() {
  await waitFullStorage();
  const { logins, enabled, pollDelay } = storage;
  if (pollingInterval) clearInterval(pollingInterval);
  if (enabled && logins && getIsLoggedInWithAnyAccount(logins)) {
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
        case MessageType.FETCH_YOUTUBE_SUBSCRIPTIONS: {
          const youtubeLogin = getYouTubeLogin(storage);
          if (youtubeLogin) fetchYouTubeSubscriptions(youtubeLogin);
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
