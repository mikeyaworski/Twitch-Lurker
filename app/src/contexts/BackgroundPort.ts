import { createContext, useEffect, useState } from 'react';
import { browser } from 'webextension-polyfill-ts';
import { ChannelType, Channel, Storage, StorageKey } from 'types';

import { MessageType } from 'app-constants';
import { hookStorage } from 'chrome-utils';
import { getFullStorage } from 'storage';

const storage = getFullStorage();

const port = browser.runtime.connect();

function fetchChannels() {
  port.postMessage({ type: MessageType.FETCH_CHANNELS });
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

function isHiddenChannel(channel: Channel, hiddenChannels: Storage['hiddenChannels']): boolean {
  return channel.type === ChannelType.TWITCH
    && hiddenChannels.twitch.includes(channel.username.toLowerCase());
}

export function useBackgroundPort(): UseBackgroundPort {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  useEffect(() => {
    port.onMessage.addListener(msg => {
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
        cb: (value: Storage[StorageKey]) => {
          const hiddenChannels = value as Storage['hiddenChannels'];
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
