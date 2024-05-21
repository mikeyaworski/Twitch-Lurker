import React, { useContext } from 'react';
import { useAtomValue } from 'jotai';
import uniq from 'lodash.uniq';
import { Typography } from '@material-ui/core';

import { ChannelType, Channel, TwitchChannel } from 'types';
import { getHiddenChannelsKey } from 'utils';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import { ChannelsAtom } from 'atoms/Channels';
import VirtualizedChannelsAutocomplete from './VirtualizedChannelsAutocomplete';

export default function HideChannels() {
  const { storage, setStorage, loading } = useContext(StorageContext);
  const channels = useAtomValue(ChannelsAtom);

  const options = loading
    ? []
    : channels
      .filter((channel): channel is TwitchChannel => channel.type === ChannelType.TWITCH)
      .filter(channel => !storage.hiddenChannels.twitch.includes(getHiddenChannelsKey(channel)));

  const hiddenChannels: Channel[] = loading
    ? []
    : storage.hiddenChannels.twitch.map(username => {
      return channels.find(c => c.type === ChannelType.TWITCH
        && c.username.toLowerCase() === username.toLowerCase()) || {
        type: ChannelType.TWITCH,
        username,
        displayName: username,
      };
    });

  function onAdd(username: string): void {
    setStorage({
      hiddenChannels: {
        ...storage.hiddenChannels,
        twitch: uniq(storage.hiddenChannels.twitch.concat(username.toLowerCase())),
      },
    }, true);
  }

  function onRemove(channel: Channel): void {
    setStorage({
      hiddenChannels: {
        ...storage.hiddenChannels,
        twitch: storage.hiddenChannels.twitch.filter(u => u !== getHiddenChannelsKey(channel)),
      },
    }, true);
  }

  return (
    <BackWrapper>
      <Typography variant="h5" align="center" gutterBottom>Hide Channels</Typography>
      <VirtualizedChannelsAutocomplete
        disabled={loading}
        options={options}
        getOptionValue={option => (option.type === ChannelType.TWITCH ? option.username : '')}
        onAdd={onAdd}
        onRemove={onRemove}
        channels={hiddenChannels}
        channelItemProps={{
          hidePlatformIcon: true,
        }}
      />
    </BackWrapper>
  );
}
