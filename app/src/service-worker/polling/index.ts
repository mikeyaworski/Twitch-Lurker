import browser from 'webextension-polyfill';
import debounce from 'lodash.debounce';
import { hookStorage } from 'src/chrome-utils';
import {
  MessageType,
  BADGE_PURPLE_BACKGROUND_COLOR,
  BADGE_DEFAULT_BACKGROUND_COLOR,
  POLL_ALARM_NAME,
} from 'src/app-constants';
import { getFullStorage, waitFullStorage } from 'src/storage';
import { AccountType, Channel, ChannelType, LiveChannel, TwitchLogin, YouTubeApiKey, KickLogin } from 'src/types';
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

const storage = getFullStorage();

let globalChannels: Channel[] = [];

function getSortedLiveChannels(channels: Channel[]): LiveChannel[] {
  const { hiddenChannels, favorites } = storage;
  return channels
    .filter(channel => !(channel.type === ChannelType.TWITCH
      && hiddenChannels?.twitch.map(username => username.toLowerCase()).includes(getHiddenChannelsKey(channel))))
    .filter((channel): channel is LiveChannel => channel.viewerCount != null && getFavoritesIncludesChannel(favorites, channel))
    .sort((a, b) => sortChannels(a, b, favorites));
}

browser.notifications.onClicked.addListener((favoriteId: string) => {
  const clickedChannel = globalChannels.find(channel => favoriteId === getFavoriteKey(channel));
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
    const oldLiveChannels = await getSortedLiveChannels(channelsBefore);
    const newLiveChannels = await getSortedLiveChannels(channelsAfter);
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
  const { favorites, hiddenChannels } = storage;
  const filteredChannels = globalChannels.filter(channel => {
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

function setChannels(channels: Channel[]) {
  notify(globalChannels, channels);
  globalChannels = channels;
  browser.runtime.sendMessage({
    type: MessageType.SEND_CHANNELS,
    data: globalChannels,
  }).catch(err => {
    // This is an expected error since there may not be a context to receive the message
    log(err);
  });
  refreshBadgeData();
}

async function fetchData() {
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
  setChannels(newChannels);
  youtubeLogin = getYouTubeLogin(storage); // get the login again because the accessToken and expiry may have been updated
  if (youtubeLogin) tryPollYouTubeSubscriptions(youtubeLogin)?.catch(error);
  if (autoOpenTabs) openTwitchTabs(newChannels);
}

async function poll() {
  await waitFullStorage();
  const { logins, enabled, pollDelay } = storage;
  await browser.alarms.clear(POLL_ALARM_NAME);
  if (enabled && logins && getIsLoggedInWithAnyAccount(logins)) {
    fetchData();
    await browser.alarms.create(POLL_ALARM_NAME, {
      delayInMinutes: Number(pollDelay),
    });
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
}

function listen() {
  browser.alarms.onAlarm.addListener(alarm => {
    switch (alarm.name) {
      case POLL_ALARM_NAME: {
        log('Polling...');
        poll();
        break;
      }
      default: break;
    }
  });
  browser.runtime.onMessage.addListener(msg => {
    switch (msg.type) {
      case MessageType.FETCH_CHANNELS: {
        browser.runtime.sendMessage({
          type: MessageType.SEND_CHANNELS,
          data: globalChannels,
        }).catch(err => {
          // This is an expected error since there may not be a context to receive the message
          log(err);
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
  poll();
}
