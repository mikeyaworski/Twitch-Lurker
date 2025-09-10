import browser from 'webextension-polyfill';
import debounce from 'lodash.debounce';
import { hookStorage, setStorage } from 'src/chrome-utils';
import {
  MessageType,
  BADGE_PURPLE_BACKGROUND_COLOR,
  BADGE_DEFAULT_BACKGROUND_COLOR,
  POLL_ALARM_NAME,
} from 'src/app-constants';
import { getFullStorage, waitFullStorage } from 'src/storage';
import { AccountType, Channel, ChannelType, LiveChannel, TwitchLogin, YouTubeApiKey, KickLogin, StorageType } from 'src/types';
import { error, log } from 'src/logging';
import {
  getChannelUrl,
  getFavoriteKey,
  getFavoritesIncludesChannel,
  getHiddenChannelsKey,
  getIsLoggedInWithAnyAccount,
  getYouTubeLogin,
  sortChannels,
} from 'src/utils';
import { openTwitchTabs } from '../tabs';
import { fetchTwitchData, handleError as handleTwitchError } from './twitch';
import { fetchData as fetchKickData } from './kick';
import {
  FetchYouTubeDataOptions,
  fetchYouTubeData,
  fetchYouTubeSubscriptions,
  tryPollYouTubeSubscriptions,
  handleError as handleYouTubeError,
} from './youtube';

const storage = getFullStorage(StorageType.SYNCED);

function getSortedLiveChannels(channels: Channel[]): LiveChannel[] {
  const { hiddenChannels, favorites } = storage;
  return channels
    .filter(channel => !(channel.type === ChannelType.TWITCH
      && hiddenChannels?.twitch.map(username => username.toLowerCase()).includes(getHiddenChannelsKey(channel))))
    .filter((channel): channel is LiveChannel => channel.viewerCount != null && getFavoritesIncludesChannel(favorites, channel))
    .sort((a, b) => sortChannels(a, b, favorites));
}

browser.notifications.onClicked.addListener(async (favoriteId: string) => {
  const { mostRecentChannels } = await waitFullStorage(StorageType.LOCAL);
  const clickedChannel = mostRecentChannels?.channels.find(channel => favoriteId === getFavoriteKey(channel));
  if (clickedChannel) {
    browser.tabs.create({
      url: getChannelUrl(clickedChannel),
      active: true,
    });
  }
});

async function isStreamOpen(channel: LiveChannel): Promise<boolean> {
  // TODO: There are some edge cases which are not handled here, but it's not really that important.
  const tabs = await browser.tabs.query({});
  return Boolean(tabs.some(tab => tab.url && tab.url === getChannelUrl(channel)));
}

async function notify(channelsBefore: Channel[], channelsAfter: Channel[]): Promise<void> {
  const { notifications } = storage;
  if (notifications) {
    const oldLiveChannels = getSortedLiveChannels(channelsBefore);
    const newLiveChannels = getSortedLiveChannels(channelsAfter);
    const topChannel = newLiveChannels[0];
    if (topChannel && (!oldLiveChannels[0] || getFavoriteKey(topChannel) !== getFavoriteKey(oldLiveChannels[0]))) {
      const streamIsOpen = await isStreamOpen(topChannel);
      if (!streamIsOpen) {
        await browser.notifications.create(getFavoriteKey(topChannel), {
          title: `${topChannel.displayName} is live!`,
          message: 'Click to view their stream.',
          type: 'basic',
          iconUrl: 'icons/icon128.png',
        });
      }
    }
  }
}

async function refreshBadgeData(): Promise<void> {
  const { enabled, favorites, hiddenChannels } = await waitFullStorage();
  if (!enabled) {
    await browser.action.setBadgeText({ text: '' });
    return;
  }
  const { mostRecentChannels } = await waitFullStorage(StorageType.LOCAL);
  const channels = mostRecentChannels?.channels || [];
  const filteredChannels = channels.filter(channel => {
    const isHiddenTwitch = channel.type === ChannelType.TWITCH
      && hiddenChannels?.twitch.map(c => c.toLowerCase()).includes(channel.username.toLowerCase());
    const isHiddenYouTube = channel.type === ChannelType.YOUTUBE
      && hiddenChannels?.youtube.includes(channel.manualInputQuery.toLowerCase());
    return !isHiddenTwitch && !isHiddenYouTube;
  });
  const isAnyFavoriteLive = filteredChannels.some(channel => channel.viewerCount != null && getFavoritesIncludesChannel(favorites, channel));
  const numStreamsLive = filteredChannels.reduce(
    (acc, channel) => acc + (channel.viewerCount != null ? 1 : 0),
    0,
  );
  await browser.action.setBadgeText({ text: String(numStreamsLive) });
  await browser.action.setBadgeBackgroundColor({
    color: isAnyFavoriteLive ? BADGE_PURPLE_BACKGROUND_COLOR : BADGE_DEFAULT_BACKGROUND_COLOR,
  });
}

async function setChannels(channels: Channel[]) {
  const { mostRecentChannels } = await waitFullStorage(StorageType.LOCAL);
  notify(mostRecentChannels?.channels || [], channels);
  await setStorage({
    mostRecentChannels: {
      fetchTime: Date.now() / 1000,
      channels,
    },
  }, StorageType.LOCAL);
  browser.runtime.sendMessage({
    type: MessageType.SEND_CHANNELS,
    data: channels,
  }).catch(err => {
    // This is an expected error since there may not be a context to receive the message
  });
  refreshBadgeData();
}

async function fetchData() {
  log('Fetching data', new Date().toISOString());
  const { logins, addedChannels, autoOpenTabs } = storage;
  const twitchLogin = logins?.find((l): l is TwitchLogin => l.type === AccountType.TWITCH);
  const youtubeApiKey = logins?.find((l): l is YouTubeApiKey => l.type === AccountType.YOUTUBE_API_KEY);
  const kickLogin = logins?.find((l): l is KickLogin => l.type === AccountType.KICK);
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
  if (kickLogin) {
    try {
      const kickChannels = await fetchKickData(
        addedChannels?.kick || [],
      );
      newChannels.push(...kickChannels);
    } catch (err) {
      error(err);
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
  await setChannels(newChannels);
  youtubeLogin = getYouTubeLogin(storage); // get the login again because the accessToken and expiry may have been updated
  if (youtubeLogin) tryPollYouTubeSubscriptions(youtubeLogin)?.catch(error);
  if (autoOpenTabs) openTwitchTabs(newChannels);
}

async function poll() {
  const { logins, enabled, pollDelay } = await waitFullStorage();
  const alreadyHadPollAlarm = Boolean(await browser.alarms.get(POLL_ALARM_NAME));
  await browser.alarms.clear(POLL_ALARM_NAME);
  if (enabled && logins && getIsLoggedInWithAnyAccount(logins)) {
    if (!alreadyHadPollAlarm) fetchData();
    await browser.alarms.create(POLL_ALARM_NAME, {
      delayInMinutes: Number(pollDelay),
    });
  } else {
    await setChannels([]);
  }
}
const debouncedPoll = debounce(poll, 3000);

async function restartPolling() {
  await browser.alarms.clear(POLL_ALARM_NAME);
  debouncedPoll();
}

function initHooks() {
  hookStorage([
    {
      key: 'logins',
      cb: restartPolling,
    },
    {
      key: 'pollDelay',
      cb: debouncedPoll,
    },
    {
      key: 'addedChannels',
      cb: restartPolling,
    },
  ]);

  hookStorage([{
    key: 'enabled',
    cb: enabled => {
      if (!enabled) {
        browser.alarms.clear(POLL_ALARM_NAME);
        setChannels([]);
      } else {
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
  hookStorage([
    {
      key: 'mostRecentChannels',
      cb: refreshBadgeData,
    },
  ]);
}

function listen() {
  browser.alarms.onAlarm.addListener(alarm => {
    switch (alarm.name) {
      case POLL_ALARM_NAME: {
        debouncedPoll();
        break;
      }
      default: break;
    }
  });
  browser.runtime.onMessage.addListener(async msg => {
    switch (msg.type) {
      case MessageType.FORCE_FETCH_CHANNELS: {
        fetchData();
        break;
      }
      case MessageType.GET_CHANNELS: {
        const { mostRecentChannels } = await waitFullStorage(StorageType.LOCAL);
        browser.runtime.sendMessage({
          type: MessageType.SEND_CHANNELS,
          data: mostRecentChannels?.channels || [],
        }).catch(err => {
          // This is an expected error since there may not be a context to receive the message
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
}

export default function initPolling() {
  listen();
  initHooks();
  refreshBadgeData();
  debouncedPoll();
}
