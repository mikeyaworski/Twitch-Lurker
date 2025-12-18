import browser, { Tabs } from 'webextension-polyfill';
import { ORIGINS } from 'src/app-constants';
import { Channel, ChannelType, LiveTwitchChannel, LiveYouTubeChannel, OriginType, TwitchChannel, YouTubeChannel } from 'src/types';
import { getStorage } from 'src/chrome-utils';
import { getFavoritesIncludesChannel, sortChannels } from 'src/utils';
import { error } from 'src/logging';
import { getTwitchUsernameFromUrl, isUrlTwitchChannel, isLockedTwitchPage, getHasTwitchHostPermission, isUrlYoutubeVideo } from './utils';

// This is a hack to import the content script and have the script be included in the build process
// https://github.com/crxjs/chrome-extension-tools/issues/687
// https://github.com/crxjs/chrome-extension-tools/pull/272
// https://dev.to/jacksteamdev/advanced-config-for-rpce-3966
// @ts-ignore
// eslint-disable-next-line import/no-unresolved, import/order
import contentScriptPath from 'src/content-scripts/main?script';

async function getTwitchChannelTabs() {
  const tabs = await browser.tabs.query({
    url: ORIGINS[OriginType.TWITCH],
  });
  return tabs.filter(tab => {
    if (!tab.url) return false;
    return isUrlTwitchChannel(tab.url);
  });
}

async function getYoutubeVideoTabs() {
  const tabs = await browser.tabs.query({
    url: ORIGINS[OriginType.YOUTUBE],
  });
  return tabs.filter(tab => {
    if(!tab.url) return false;
    return isUrlYoutubeVideo(tab.url)
  })
}

function injectContentScript(tabId: number) {
  browser.tabs.onUpdated.addListener(async (updateTabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && updateTabId === tabId) {
      await browser.scripting.executeScript({
        target: { tabId },
        files: [contentScriptPath],
      });
    }
  });
}

async function openTwitchTab(channel: TwitchChannel) {
  const { autoMuteTabs, openTabsInBackground } = await getStorage(['autoMuteTabs', 'openTabsInBackground']);
  const newTab = await browser.tabs.create({
    url: `https://twitch.tv/${channel.username}`,
    active: !openTabsInBackground,
  });
  if (autoMuteTabs) {
    browser.tabs.update(newTab.id!, {
      muted: true,
    });
    injectContentScript(newTab.id!);
  }
  if (!openTabsInBackground) {
    await new Promise<void>(resolve => {
      function listener(tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType) {
        if (changeInfo.status === 'complete' && tabId === newTab.id) {
          resolve();
          browser.tabs.onUpdated.removeListener(listener);
        }
      }
      browser.tabs.onUpdated.addListener(listener);
      // Resolve after 5 seconds if the tab never loads
      setTimeout(() => {
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 5000);
    });
  }
}

// TODO all that is differnet here is the url of the tab so can likely combine with above
async function openYoutubeTab(channel: LiveYouTubeChannel) {
  const { autoMuteTabs, openTabsInBackground } = await getStorage(['autoMuteTabs', 'openTabsInBackground']);
  const newTab = await browser.tabs.create({
    url: `https://youtube.com/watch?v=${channel.videoId}`,
    active: !openTabsInBackground,
  });
  if (autoMuteTabs) {
    browser.tabs.update(newTab.id!, {
      muted: true,
    });
    injectContentScript(newTab.id!);
  }
  if (!openTabsInBackground) {
    await new Promise<void>(resolve => {
      function listener(tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType) {
        if (changeInfo.status === 'complete' && tabId === newTab.id) {
          resolve();
          browser.tabs.onUpdated.removeListener(listener);
        }
      }
      browser.tabs.onUpdated.addListener(listener);
      // Resolve after 5 seconds if the tab never loads
      setTimeout(() => {
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 5000);
    });
  }
}

async function updateTwitchTab(liveChannel: LiveTwitchChannel, candidateTwitchTab: Tabs.Tab, tabChannel: Channel | undefined) {
  const {
    autoMuteTabs,
    favorites,
    openTabsInBackground,
  } = await getStorage(['autoMuteTabs', 'favorites', 'openTabsInBackground']);
  const order = tabChannel ? sortChannels(tabChannel, liveChannel, favorites!) : 1;
  if (order > 0) {
    const active = !openTabsInBackground;
    await browser.tabs.update(candidateTwitchTab.id, {
      url: `https://twitch.tv/${liveChannel.username}`,
      active: active || undefined,
    });
    if (autoMuteTabs) injectContentScript(candidateTwitchTab.id!);
    if (active) {
      await new Promise<void>(resolve => {
        // Resolve after 5 seconds if the tab never loads
        setTimeout(resolve, 5000);
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
          if (changeInfo.status === 'complete' && tabId === candidateTwitchTab.id) {
            resolve();
          }
        });
      });
    }
  }
}

// TODO: Write unit tests for this
export async function openTwitchTabs(channels: Channel[]) {
  const hasTwitchHostPermission = await getHasTwitchHostPermission();
  if (!hasTwitchHostPermission) {
    error('Tried to open Twitch tabs but did not have host permission for Twitch');
    return;
  }

  const { favorites, maxStreams, autoMuteTabs, hiddenChannels } = await getStorage(['favorites', 'maxStreams', 'autoMuteTabs', 'hiddenChannels']);
  if (!maxStreams || !favorites) return;
  const liveFavorites = channels
    .filter((c): c is TwitchChannel => c.type === ChannelType.TWITCH)
    .filter(channel => !hiddenChannels?.twitch.map(c => c.toLowerCase()).includes(channel.username.toLowerCase()))
    .filter((c): c is LiveTwitchChannel => Boolean(c.viewerCount) && getFavoritesIncludesChannel(favorites, c))
    .sort((a, b) => sortChannels(a, b, favorites));
  const tabs = await getTwitchChannelTabs();
  // If they have the auto mute tabs pref enabled, then only take over tabs which are muted.
  const allOpenTwitchUsernames = tabs.map(tab => getTwitchUsernameFromUrl(tab.url!)).filter(Boolean) as string[];
  const replaceableTwitchTabs = tabs
    .filter(tab => tab.url && !isLockedTwitchPage(tab.url))
    .filter(tab => (!autoMuteTabs || tab.mutedInfo?.muted) && Boolean(getTwitchUsernameFromUrl(tab.url!)))
    .sort((a, b) => {
      const aChannel = liveFavorites.find(channel => channel.username === getTwitchUsernameFromUrl(a.url!));
      const bChannel = liveFavorites.find(channel => channel.username === getTwitchUsernameFromUrl(b.url!));
      if (!aChannel) return 1;
      if (!bChannel) return -1;
      return sortChannels(aChannel, bChannel, favorites);
    })
    // Reverse so that we can replace ones at the beginning of the list (increasing order of importance).
    .reverse()
    .slice(0, Number(maxStreams));
  const liveCandidates = liveFavorites
    // Filter out replacement candidates that are already open
    .filter(channel => !allOpenTwitchUsernames.includes(channel.username))
    .slice(0, Number(maxStreams));
  const numNewTabs = Math.max(0, Number(maxStreams) - tabs.length);
  const newLiveChannels = liveCandidates.slice(0, numNewTabs);
  const numReplaceables = Math.min(liveCandidates.length - numNewTabs, replaceableTwitchTabs.length);
  for (let i = 0; i < newLiveChannels.length; i++) {
    await openTwitchTab(newLiveChannels[i]);
  }
  for (let i = 0; i < numReplaceables; i++) {
    const liveChannel = liveCandidates[numNewTabs + i];
    const candidateTwitchTab = replaceableTwitchTabs[i];
    const tabUsername = getTwitchUsernameFromUrl(candidateTwitchTab.url!);
    if (tabUsername === liveChannel.username) continue;
    const tabChannel = liveFavorites.find(channel => channel.username === tabUsername);
    await updateTwitchTab(liveChannel, candidateTwitchTab, tabChannel);
  }
}

// TODO this can likely be combined with the above and future kick streams with some minor changes
// TODO this doesn't take into account open twitch tabs, so you could have maxStreams open for both twitch and youtube.
//  I figure that combining the two functions would help in that regard as well. Maybe these would also be better off as two separate extensions/builds?
export async function openYoutubeTabs(channels: Channel[]) {
  const { favorites, maxStreams, autoMuteTabs, hiddenChannels } = await getStorage(['favorites', 'maxStreams', 'autoMuteTabs', 'hiddenChannels']);
  if (!maxStreams || !favorites) return;
  const liveFavorites = channels
    .filter((c): c is YouTubeChannel => c.type === ChannelType.YOUTUBE)

    // NOTE: not doing anything with hidden channels

    .filter((c): c is LiveYouTubeChannel => Boolean(c.viewerCount) && getFavoritesIncludesChannel(favorites, c))
    .sort((a, b) => sortChannels(a, b, favorites));

  // for youtube this would also include various other yt videos as it is the same structure, so really "maxStreams" becomes "maxYoutubeVideosOrStreams" pretty much
  const tabs = await getYoutubeVideoTabs();
  const openVideoIds = tabs.map(tab => {
      if(tab.url) {
        return new URL(tab.url).searchParams.get('v');
      } else {
        null
      }
    })

  // TODO at initial glance I don't really understand what the replacing stuff is meant to be doing so just cutting it out for now. Really just look to see if a tab is already open,
  // if so don't open it again

  const liveCandidates = liveFavorites
    .filter(channel => !openVideoIds.includes(channel.videoId))
    .slice(0, Number(maxStreams));

  const numNewTabs = Math.max(0, Number(maxStreams) - tabs.length);
  const newLiveChannels = liveCandidates.slice(0, numNewTabs);
  for (let i = 0; i < newLiveChannels.length; i++) {
    await openYoutubeTab(newLiveChannels[i]);
  }
}