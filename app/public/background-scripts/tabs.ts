import { browser, Tabs } from 'webextension-polyfill-ts';
import type { Channel, LiveChannel } from '../../src/types';
import { getTwitchUsernameFromUrl } from './utils';
import { getStorage } from '../../src/chrome-utils';
import { sortChannels } from '../../src/utils';

export async function getTwitchTabs() {
  const tabs = await browser.tabs.query({});
  return tabs.filter(tab => {
    if (!tab.url) return false;
    const url = new URL(tab.url);
    return /(www.|m.)?twitch.tv/.test(url.hostname) && /^\/([^/]+)\/?$/;
  });
}

function injectContentScript(tabId: number) {
  browser.tabs.onUpdated.addListener(async (updateTabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && updateTabId === tabId) {
      await browser.tabs.executeScript(tabId, {
        file: 'content-script-bundle.js',
      });
    }
  });
}

async function openTwitchTab(channel: Channel) {
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

async function updateTwitchTab(liveChannel: Channel, candidateTwitchTab: Tabs.Tab, tabChannel: Channel | undefined) {
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

export async function openTwitchTabs(channels: Channel[]) {
  const { favorites, maxStreams, autoMuteTabs, hiddenChannels } = await getStorage(['favorites', 'maxStreams', 'autoMuteTabs', 'hiddenChannels']);
  if (!maxStreams || !favorites) return;
  const liveChannels = channels
    .filter(channel => !hiddenChannels?.twitch.includes(channel.username.toLowerCase()))
    .filter(channel => channel.viewerCount && favorites.includes(channel.username))
    .sort((a, b) => sortChannels(a as LiveChannel, b as LiveChannel, favorites)) as LiveChannel[];
  const tabs = await getTwitchTabs();
  // If they have the auto mute tabs pref enabled, then only take over tabs which are muted.
  const allOpenTwitchUsernames = tabs.map(tab => getTwitchUsernameFromUrl(tab.url!)).filter(Boolean) as string[];
  const replaceableTwitchTabs = tabs
    .filter(tab => (!autoMuteTabs || tab.mutedInfo?.muted) && Boolean(getTwitchUsernameFromUrl(tab.url!)))
    .sort((a, b) => {
      const aChannel = liveChannels.find(channel => channel.username === getTwitchUsernameFromUrl(a.url!));
      const bChannel = liveChannels.find(channel => channel.username === getTwitchUsernameFromUrl(b.url!));
      if (!aChannel) return 1;
      if (!bChannel) return -1;
      return sortChannels(aChannel, bChannel, favorites);
    })
    // Reverse so that we can replace ones at the beginning of the list (increasing order of importance).
    .reverse()
    .slice(0, Number(maxStreams));
  const liveCandidates = liveChannels
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
    const tabChannel = liveChannels.find(channel => channel.username === tabUsername);
    await updateTwitchTab(liveChannel, candidateTwitchTab, tabChannel);
  }
}
