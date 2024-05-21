import { useEffect } from 'react';
import browser from 'webextension-polyfill';
import { atom, useSetAtom } from 'jotai';
import { ChannelType, Channel, StorageSync } from 'types';

import { MessageType } from 'app-constants';
import { hookStorage } from 'chrome-utils';
import { getFullStorage } from 'storage';

export const ChannelsAtom = atom<Channel[]>([]);
export const FilteredChannelsAtom = atom<Channel[]>([]);

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
            setFilteredChannels(currentChannels.filter(channel => !isHiddenChannel(channel, hiddenChannels)));
            return currentChannels;
          });
        },
      },
    ]);
  }, [setChannels, setFilteredChannels]);
}
