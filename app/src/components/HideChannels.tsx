import React, { useContext } from 'react';
import uniq from 'lodash.uniq';
import { Typography } from '@material-ui/core';

import { ChannelType, Channel } from 'types';
import { getHiddenChannelsKey } from 'utils';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import BackgroundPortContext from 'contexts/BackgroundPort';
import VirtualizedChannelsAutocomplete from './VirtualizedChannelsAutocomplete';

export default function HideChannels() {
  const { storage, setStorage, loading } = useContext(StorageContext);
  const { channels } = useContext(BackgroundPortContext);

  const options = loading
    ? []
    : channels
      .filter(channel => !(channel.type === ChannelType.TWITCH && storage.hiddenChannels.twitch.includes(channel.username.toLowerCase())));

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
