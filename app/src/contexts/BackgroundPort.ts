import { createContext, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { ChannelType, Channel, StorageSync } from 'types';

import { MessageType } from 'app-constants';
import { hookStorage } from 'chrome-utils';
import { getFullStorage } from 'storage';

const storage = getFullStorage();

function fetchChannels() {
  browser.runtime.sendMessage({ type: MessageType.FETCH_CHANNELS });
}

export function fetchYouTubeSubscriptions() {
  browser.runtime.sendMessage({ type: MessageType.FETCH_YOUTUBE_SUBSCRIPTIONS });
}

type UseBackgroundPort = {
  channels: Channel[],
  filteredChannels: Channel[],
};

export default createContext<UseBackgroundPort>({
  channels: [],
  // filteredChannels omits the hidden channels
  filteredChannels: [],
});

function isHiddenChannel(channel: Channel, hiddenChannels: StorageSync['hiddenChannels']): boolean {
  return channel.type === ChannelType.TWITCH
    && hiddenChannels.twitch.includes(channel.username.toLowerCase());
}

export function useBackgroundPort(): UseBackgroundPort {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  useEffect(() => {
    browser.runtime.onMessage.addListener(msg => {
      if (msg.type === MessageType.SEND_CHANNELS) {
        const channelsMsg = msg.data as Channel[];
        setChannels(channelsMsg);
        setFilteredChannels(channelsMsg.filter(channel => !isHiddenChannel(channel, storage.hiddenChannels)));
      }
    });
    fetchChannels();
  }, []);

  useEffect(() => {
    hookStorage([
      {
        key: 'hiddenChannels',
        cb: (value: unknown) => {
          const hiddenChannels = value as StorageSync['hiddenChannels'];
          setChannels(currentChannels => {
            setFilteredChannels(currentChannels.filter(channel => !isHiddenChannel(channel, hiddenChannels)));
            return currentChannels;
          });
        },
      },
    ]);
  }, []);

  return {
    channels,
    filteredChannels,
  };
}
