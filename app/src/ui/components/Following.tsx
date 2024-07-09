import { useCallback, useState } from 'react';
import browser from 'webextension-polyfill';
import { useAtomValue } from 'jotai';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Box, MenuItem, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Channel, ChannelType, MessageType } from 'src/types';
import { useStorage } from 'src/ui/stores/Storage';
import { FilteredChannelsAtom } from 'src/ui/atoms/Channels';
import { IsFullscreenAtom } from 'src/ui/atoms/IsFullscreen';
import { useTemporaryToggle } from 'src/ui/hooks';
import { getFavoriteValue, getFavoritesIncludesChannel, getFormattedFavorites, getId, sortChannels } from 'src/utils';
import ChannelItem, { ChannelItemSkeleton, ITEM_SIZE as CHANNEL_ITEM_SIZE } from './ChannelItem';

// This was manually observed
const SEARCH_CONTAINER_HEIGHT = 80;

function ListItem({ data, style, index }: ListChildComponentProps<(Channel | undefined)[]>) {
  const storage = useStorage(store => store.storage);
  const loading = useStorage(store => store.loading);
  const setStorage = useStorage(store => store.setStorage);

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

  const channel = data[index];
  if (loading || !channel) {
    return <ChannelItemSkeleton key={index} showLiveCount />;
  }

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
      style={style}
    />
  );
}

export default function FollowingComponent() {
  const isFullscreen = useAtomValue(IsFullscreenAtom);

  const [filter, setFilter] = useState('');
  const storage = useStorage(store => store.storage);
  const setStorage = useStorage(store => store.setStorage);
  const channels = useAtomValue(FilteredChannelsAtom);

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

  const filteredChannels = channels
    ?.filter(filterFn)
    .sort((a, b) => sortChannels(a, b, storage.favorites, storage.sortLow));

  return (
    <>
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
      <Box sx={{
        // 20px for padding
        height: `calc(100% - ${SEARCH_CONTAINER_HEIGHT}px - 20px)`,
        width: isFullscreen ? 450 : 400,
        margin: '0 auto',
        '& ul': {
          margin: 0,
          padding: 0,
        },
      }}
      >
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              itemData={filteredChannels ?? []}
              itemCount={filteredChannels ? filteredChannels.length : 10}
              itemSize={CHANNEL_ITEM_SIZE}
              height={height}
              width={width}
              overscanCount={5}
              outerElementType="ul"
            >
              {ListItem}
            </FixedSizeList>
          )}
        </AutoSizer>
      </Box>
    </>
  );
}
