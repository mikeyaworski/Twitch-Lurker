import React, { useState } from 'react';
import browser from 'webextension-polyfill';
import { useAtomValue } from 'jotai';
import uniq from 'lodash.uniq';
import { useShallow } from 'zustand/react/shallow';
import { Typography, FormControlLabel, RadioGroup, InputAdornment, IconButton, Tooltip } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';

import { AccountType, Channel, ChannelType, StorageSync, MessageType } from 'types';
import { getAddedChannelsKey, getYouTubeLogin, shouldConvertKeyToLowerCase } from 'utils';
import { useTemporaryToggle } from 'hooks';
import { useStorage } from 'stores/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import { ChannelsAtom } from 'atoms/Channels';
import SmallRadio from 'widgets/SmallRadio';
import VirtualizedChannelsAutocomplete from './VirtualizedChannelsAutocomplete';

function fetchYouTubeSubscriptions() {
  browser.runtime.sendMessage({ type: MessageType.FETCH_YOUTUBE_SUBSCRIPTIONS });
}

type AccountKey = keyof StorageSync['addedChannels'];

export default function AddChannels() {
  const { storage, storageLocal, setStorage, loading } = useStorage(useShallow(store => ({
    storage: store.storage,
    storageLocal: store.storageLocal,
    setStorage: store.setStorage,
    loading: store.loading,
  })));
  const channels = useAtomValue(ChannelsAtom);

  const [fetchYouTubeSubscriptionsDisabled, setFetchYouTubeSubscriptionsDisabled] = useState(false);
  useTemporaryToggle({ value: fetchYouTubeSubscriptionsDisabled, setValue: setFetchYouTubeSubscriptionsDisabled, timeoutMs: 5000 });

  const hasYouTubeLogin = getYouTubeLogin(storage);
  const hasYouTubeAccount = storage.logins.some(login => login.type === AccountType.YOUTUBE_API_KEY
    || login.type === AccountType.YOUTUBE);
  const hasKickAccount = storage.logins.some(login => login.type === AccountType.KICK);
  const [selectedAccount, setSelectedAccount] = useState<AccountKey>(hasYouTubeAccount
    ? 'youtube'
    : hasKickAccount
      ? 'kick'
      : 'twitch',
  );

  const addedChannels: Channel[] = loading
    ? []
    : storage.addedChannels[selectedAccount].map(addedChannel => {
      let type: ChannelType = ChannelType.TWITCH;
      let channel: Channel | undefined;
      switch (selectedAccount) {
        case 'twitch': {
          type = ChannelType.TWITCH;
          channel = channels.find(c => c.type === ChannelType.TWITCH && c.username.toLowerCase() === addedChannel.toLowerCase());
          break;
        }
        case 'youtube': {
          type = ChannelType.YOUTUBE;
          channel = channels.find(c => c.type === ChannelType.YOUTUBE && c.manualInputQuery === addedChannel);
          break;
        }
        case 'kick': {
          type = ChannelType.KICK;
          channel = channels.find(c => c.type === ChannelType.KICK && c.username.toLowerCase() === addedChannel.toLowerCase());
          break;
        }
        default: {
          break;
        }
      }
      const notFoundChannel = {
        type,
        id: addedChannel,
        username: addedChannel,
        manualInputQuery: addedChannel,
        displayName: addedChannel,
      };
      return channel || notFoundChannel;
    });

  function onAdd(username: string): void {
    username = shouldConvertKeyToLowerCase(selectedAccount) ? username.toLowerCase() : username;
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
      {(hasYouTubeAccount || hasKickAccount) && (
        <RadioGroup
          style={{ flexDirection: 'row', marginBottom: 4 }}
          name="account"
          value={selectedAccount}
          onChange={e => setSelectedAccount(e.target.value as AccountKey)}
        >
          <FormControlLabel value="twitch" control={<SmallRadio color="primary" size="small" />} label="Twitch" />
          {hasYouTubeAccount && (
            <FormControlLabel value="youtube" control={<SmallRadio color="primary" size="small" />} label="YouTube" />
          )}
          {hasKickAccount && (
            <FormControlLabel value="kick" control={<SmallRadio color="primary" size="small" />} label="Kick" />
          )}
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
