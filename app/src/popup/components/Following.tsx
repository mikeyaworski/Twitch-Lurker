import { useCallback, useState } from 'react';
import browser from 'webextension-polyfill';
import { useAtomValue } from 'jotai';
import { Box, MenuItem, Select, TextField, List, InputAdornment, IconButton, SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Channel, ChannelType, MessageType } from 'src/types';
import { useStorage } from 'src/popup/stores/Storage';
import { FilteredChannelsAtom } from 'src/popup/atoms/Channels';
import { useTemporaryToggle } from 'src/hooks';
import { getFavoriteValue, getFavoritesIncludesChannel, getFormattedFavorites, getId, sortChannels } from 'src/utils';
import ChannelItem, { ChannelItemSkeleton } from './ChannelItem';

const listContainerStyles = {
  overflowY: 'scroll',
  height: 400,
  width: 400,
  flexGrow: 1,
  margin: '0 auto',
};

export default function FollowingComponent() {
  const [filter, setFilter] = useState('');
  const loading = useStorage(store => store.loading);
  const storage = useStorage(store => store.storage);
  const setStorage = useStorage(store => store.setStorage);
  const channels = useAtomValue(FilteredChannelsAtom);

  const handleRemoveFavorite = useCallback((channel: Channel) => {
    setStorage({
      favorites: getFormattedFavorites(storage.favorites).filter(f => f.type !== channel.type || f.value !== getFavoriteValue(channel)),
    });
  }, [setStorage, storage.favorites]);

  const handleAddFavorite = useCallback((channel: Channel) => {
    setStorage({
      favorites: getFormattedFavorites(storage.favorites).concat({
        type: channel.type,
        value: getFavoriteValue(channel),
      }),
    });
  }, [setStorage, storage.favorites]);

  const handleSortChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(e => {
    setStorage({
      sortLow: Boolean(e.target.value),
    });
  }, [setStorage]);

  const [refetchDataButtonDisabled, setRefetchDataButtonDisabled] = useState(false);
  useTemporaryToggle({ value: refetchDataButtonDisabled, setValue: setRefetchDataButtonDisabled, timeoutMs: 5000 });

  const handleRefresh = useCallback(() => {
    browser.runtime.sendMessage({ type: MessageType.FORCE_FETCH_CHANNELS });
    setRefetchDataButtonDisabled(true);
  }, []);

  function filterFn(channel: Channel) {
    const hasUsername = 'username' in channel
      && channel.username.toLowerCase().includes(filter.trim().toLowerCase());
    const hasDisplayName = channel.displayName.toLowerCase().includes(filter.trim().toLowerCase());
    const hasCustomUrl = channel.type === ChannelType.YOUTUBE
      && channel.customUrl?.toLowerCase().includes(filter.trim().toLowerCase());
    return hasUsername || hasDisplayName || hasCustomUrl;
  }

  const searchContainer = (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={2.5}
      sx={{
        '& > *:not(:last-child)': {
          mr: 1,
        },
      }}
    >
      <TextField
        placeholder="Search..."
        variant="outlined"
        size="small"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        sx={{ width: 250 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setFilter('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        value={storage.sortLow ? 1 : 0}
        variant="outlined"
        label="Sort by"
        size="small"
        color="primary"
        select
        onChange={handleSortChange}
      >
        <MenuItem color="info" value={1}>Lowest</MenuItem>
        <MenuItem color="info" value={0}>Highest</MenuItem>
      </TextField>
      <IconButton
        onClick={handleRefresh}
        disabled={refetchDataButtonDisabled}
        title="Force refresh channels"
        size="small"
      >
        <RefreshIcon />
      </IconButton>
    </Box>
  );

  if (loading || !channels) {
    return (
      <>
        {searchContainer}
        <List dense sx={listContainerStyles}>
          {new Array(10).fill(0).map((_, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <ChannelItemSkeleton key={idx} showLiveCount />
          ))}
        </List>
      </>
    );
  }

  return (
    <>
      {searchContainer}
      <List dense sx={listContainerStyles}>
        {channels
          .filter(filterFn)
          .sort((a, b) => sortChannels(a, b, storage.favorites, storage.sortLow))
          .map(channel => {
            const isFavorite = getFavoritesIncludesChannel(storage.favorites, channel);
            return (
              <ChannelItem
                key={getId(channel)}
                hoverable
                linked
                showLiveCount
                channel={channel}
                onIconClick={isFavorite ? handleRemoveFavorite : handleAddFavorite}
                Icon={isFavorite ? StarRoundedIcon : StarBorderRoundedIcon}
              />
            );
          })}
      </List>
    </>
  );
}
