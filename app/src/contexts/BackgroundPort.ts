import { createContext, useEffect, useState } from 'react';
import { browser } from 'webextension-polyfill-ts';
import type { Channel, Storage, StorageKey } from 'types';

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

export function useBackgroundPort(): UseBackgroundPort {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  useEffect(() => {
    port.onMessage.addListener(msg => {
      if (msg.type === MessageType.SEND_CHANNELS) {
        const channelsMsg = msg.data as Channel[];
        setChannels(channelsMsg);
        setFilteredChannels(channelsMsg.filter(channel => !storage.hiddenChannels.twitch.includes(channel.username.toLowerCase())));
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
            setFilteredChannels(currentChannels.filter(channel => !hiddenChannels.twitch.includes(channel.username.toLowerCase())));
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
