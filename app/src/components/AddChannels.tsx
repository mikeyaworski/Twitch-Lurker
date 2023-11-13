import React, { useContext, useState } from 'react';
import uniq from 'lodash.uniq';
import { Button, Typography, Radio, FormControlLabel, RadioGroup, InputAdornment, IconButton, Tooltip } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';

import { AccountType, Channel, ChannelType, StorageSync } from 'types';
import { getAddedChannelsKey, getYouTubeLogin } from 'utils';
import { useTemporaryToggle } from 'hooks';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import BackgroundPortContext, { fetchYouTubeSubscriptions } from 'contexts/BackgroundPort';
import VirtualizedChannelsAutocomplete from './VirtualizedChannelsAutocomplete';

type AccountKey = keyof StorageSync['addedChannels'];

export default function AddChannels() {
  const { storage, storageLocal, setStorage, loading } = useContext(StorageContext);
  const { channels } = useContext(BackgroundPortContext);

  const [fetchYouTubeSubscriptionsDisabled, setFetchYouTubeSubscriptionsDisabled] = useState(false);
  useTemporaryToggle({ value: fetchYouTubeSubscriptionsDisabled, setValue: setFetchYouTubeSubscriptionsDisabled, timeoutMs: 5000 });

  const hasYouTubeLogin = getYouTubeLogin(storage);
  const hasYouTubeAccount = storage.logins.some(login => login.type === AccountType.YOUTUBE_API_KEY
    || login.type === AccountType.YOUTUBE);
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

  const autocompleteOptions: Channel[] | boolean | undefined = selectedAccount === 'youtube'
    && storageLocal.youtubeSubscriptions?.subscriptions
      .map<Channel>(sub => ({
        type: ChannelType.YOUTUBE,
        id: sub.channelId,
        manualInputQuery: sub.channelId,
        displayName: sub.displayName,
      }))
      .filter(channel => !storage.addedChannels.youtube.includes(getAddedChannelsKey(channel)));

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
        options={autocompleteOptions || []}
        getOptionValue={option => (option.type === ChannelType.YOUTUBE ? option.id : '')}
        onAdd={onAdd}
        onRemove={onRemove}
        channels={addedChannels}
        hint={selectedAccount === 'youtube' ? 'Channel ID' : 'Username'}
        tooltip={selectedAccount === 'youtube' && (
          <>
            Enter their Channel ID or username.
            {' '}
            Their custom URL (e.g. @some-channel) is not necessarily their username, but it can be if they have a longstanding channel.
            If you don&apos;t know their username, then you need to find their channel ID. Search up a tool to get channel IDs.
          </>
        )}
        channelItemProps={{
          hidePlatformIcon: true,
        }}
        endAdornment={hasYouTubeLogin && selectedAccount === 'youtube' && (
          <InputAdornment position="end">
            <Tooltip arrow title="Refresh YouTube subscriptions. Please do not spam this.">
              <IconButton
                size="small"
                onClick={() => {
                  fetchYouTubeSubscriptions();
                  setFetchYouTubeSubscriptionsDisabled(true);
                }}
                disabled={fetchYouTubeSubscriptionsDisabled}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        )}
      />
    </BackWrapper>
  );
}
