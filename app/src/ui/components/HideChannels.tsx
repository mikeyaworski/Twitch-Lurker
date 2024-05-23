import { useAtomValue } from 'jotai';
import uniq from 'lodash.uniq';
import { Typography } from '@mui/material';

import { ChannelType, Channel, TwitchChannel } from 'src/types';
import { getHiddenChannelsKey } from 'src/utils';
import { useStorage } from 'src/ui/stores/Storage';
import BackWrapper from 'src/ui/components/Router/BackWrapper';
import { ChannelsAtom } from 'src/ui/atoms/Channels';
import VirtualizedChannelsAutocomplete from './VirtualizedChannelsAutocomplete';

export default function HideChannels() {
  const loading = useStorage(store => store.loading);
  const storage = useStorage(store => store.storage);
  const setStorage = useStorage(store => store.setStorage);
  const channels = useAtomValue(ChannelsAtom);

  const options = loading || !channels
    ? []
    : channels
      .filter((channel): channel is TwitchChannel => channel.type === ChannelType.TWITCH)
      .filter(channel => !storage.hiddenChannels.twitch.includes(getHiddenChannelsKey(channel)));

  const hiddenChannels: Channel[] = loading || !channels
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
