import React, { useContext } from 'react';
import uniq from 'lodash.uniq';
import { Typography } from '@material-ui/core';

import type { Channel } from 'types';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import BackgroundPortContext from 'contexts/BackgroundPort';
import VirtualizedAutocomplete from './VirtualizedAutocomplete';

export default function HideChannels() {
  const { storage, setStorage, loading } = useContext(StorageContext);
  const { channels } = useContext(BackgroundPortContext);

  const options = loading
    ? []
    : channels
      .map(c => c.displayName)
      .filter(username => !storage.hiddenChannels.twitch.includes(username.toLowerCase()));

  const hiddenChannels: Channel[] = loading
    ? []
    : storage.hiddenChannels.twitch.map(username => {
      return channels.find(c => c.username.toLowerCase() === username.toLowerCase()) || {
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

  function onRemove(username: string): void {
    setStorage({
      hiddenChannels: {
        ...storage.hiddenChannels,
        twitch: storage.hiddenChannels.twitch.filter(u => u !== username.toLowerCase()),
      },
    }, true);
  }

  return (
    <BackWrapper>
      <Typography variant="h5" align="center" gutterBottom>Hide Channels</Typography>
      <VirtualizedAutocomplete
        disabled={loading}
        options={options}
        onAdd={onAdd}
        onRemove={onRemove}
        channels={hiddenChannels}
      />
    </BackWrapper>
  );
}
