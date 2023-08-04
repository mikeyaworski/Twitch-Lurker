import React, { useContext, useState } from 'react';
import uniq from 'lodash.uniq';
import { Typography, Radio, FormControlLabel, RadioGroup } from '@material-ui/core';

import { AccountType, Channel, ChannelType, Storage } from 'types';
import { getAddedChannelsKey } from 'utils';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import BackgroundPortContext from 'contexts/BackgroundPort';
import VirtualizedChannelsAutocomplete from './VirtualizedChannelsAutocomplete';

type AccountKey = keyof Storage['addedChannels'];

export default function AddChannels() {
  const { storage, setStorage, loading } = useContext(StorageContext);
  const { channels } = useContext(BackgroundPortContext);

  const hasYouTubeAccount = storage.logins.some(login => login.type === AccountType.YOUTUBE_API_KEY);
  const [selectedAccount, setSelectedAccount] = useState<AccountKey>(hasYouTubeAccount ? 'youtube' : 'twitch');

  const addedChannels: Channel[] = loading
    ? []
    : storage.addedChannels[selectedAccount].map(addedChannel => {
      const notFoundChannel = {
        type: selectedAccount === 'twitch'
          ? ChannelType.TWITCH
          : ChannelType.YOUTUBE,
        id: addedChannel,
        username: addedChannel,
        manualInputQuery: addedChannel,
        displayName: addedChannel,
      };
      const channel = selectedAccount === 'twitch'
        ? channels.find(c => c.type === ChannelType.TWITCH && c.username.toLowerCase() === addedChannel.toLowerCase())
        : channels.find(c => c.type === ChannelType.YOUTUBE && c.manualInputQuery === addedChannel);
      return channel || notFoundChannel;
    });

  function onAdd(username: string): void {
    setStorage({
      addedChannels: {
        ...storage.addedChannels,
        [selectedAccount]: uniq(storage.addedChannels[selectedAccount].concat(username)),
      },
    }, true);
  }

  function onRemove(channel: Channel): void {
    setStorage({
      addedChannels: {
        ...storage.addedChannels,
        [selectedAccount]: storage.addedChannels[selectedAccount].filter(key => key !== getAddedChannelsKey(channel)),
      },
    }, true);
  }

  return (
    <BackWrapper>
      <Typography variant="h5" align="center" gutterBottom>Add Channels</Typography>
      {hasYouTubeAccount && (
        <RadioGroup
          style={{ flexDirection: 'row' }}
          name="account"
          value={selectedAccount}
          onChange={e => setSelectedAccount(e.target.value as AccountKey)}
        >
          <FormControlLabel value="twitch" control={<Radio color="primary" />} label="Twitch" />
          <FormControlLabel value="youtube" control={<Radio color="primary" />} label="YouTube" />
        </RadioGroup>
      )}
      <VirtualizedChannelsAutocomplete
        disabled={loading}
        options={[]}
        getOptionValue={() => ''}
        onAdd={onAdd}
        onRemove={onRemove}
        channels={addedChannels}
        hint={selectedAccount === 'youtube' ? 'Username or Channel ID' : 'Username'}
        tooltip={(
          <>
            Their custom URL (e.g. @some-channel) is not necessarily their username, but it can be if they have a longstanding channel.
            If you don&apos;t know their username, then you need to find their channel ID. Search up a tool to get channel IDs.
          </>
        )}
        channelItemProps={{
          hidePlatformIcon: true,
        }}
      />
    </BackWrapper>
  );
}
