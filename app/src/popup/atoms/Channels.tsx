import { useEffect } from 'react';
import browser from 'webextension-polyfill';
import { atom, useSetAtom } from 'jotai';
import { ChannelType, Channel, StorageSync } from 'src/types';

import { MessageType } from 'src/app-constants';
import { hookStorage } from 'src/chrome-utils';
import { getFullStorage } from 'src/storage';

export const ChannelsAtom = atom<Channel[] | null>(null);
export const FilteredChannelsAtom = atom<Channel[] | null>(null);

const storage = getFullStorage();

function fetchChannels() {
  browser.runtime.sendMessage({ type: MessageType.FETCH_CHANNELS });
}

function isHiddenChannel(channel: Channel, hiddenChannels: StorageSync['hiddenChannels']): boolean {
  return channel.type === ChannelType.TWITCH
    && hiddenChannels.twitch.includes(channel.username.toLowerCase());
}

export function useChannelAtomsInitialization() {
  const setChannels = useSetAtom(ChannelsAtom);
  const setFilteredChannels = useSetAtom(FilteredChannelsAtom);

  useEffect(() => {
    browser.runtime.onMessage.addListener(msg => {
      if (msg.type === MessageType.SEND_CHANNELS) {
        const channelsMsg = msg.data as Channel[];
        setChannels(channelsMsg);
        setFilteredChannels(channelsMsg.filter(channel => !isHiddenChannel(channel, storage.hiddenChannels)));
      }
    });
    fetchChannels();
  }, [setChannels, setFilteredChannels]);

  useEffect(() => {
    hookStorage([
      {
        key: 'hiddenChannels',
        cb: (value: unknown) => {
          const hiddenChannels = value as StorageSync['hiddenChannels'];
          setChannels(currentChannels => {
            setFilteredChannels((currentChannels || []).filter(channel => !isHiddenChannel(channel, hiddenChannels)));
            return currentChannels;
          });
        },
      },
    ]);
  }, [setChannels, setFilteredChannels]);
}
