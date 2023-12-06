import React, { useCallback, useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { MenuItem, TextField, List, InputAdornment, IconButton } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import StarRoundedIcon from '@material-ui/icons/StarRounded';
import StarBorderRoundedIcon from '@material-ui/icons/StarBorderRounded';
import ClearIcon from '@material-ui/icons/Clear';
import { Channel, ChannelType } from 'types';
import StorageContext from 'contexts/Storage';
import BackgroundPortContext from 'contexts/BackgroundPort';
import { getFavoriteValue, getFavoritesIncludesChannel, getFormattedFavorites, getId, sortChannels } from 'utils';
import ChannelItem, { ChannelItemSkeleton } from './ChannelItem';

const useStyles = makeStyles({
  listContainer: {
    overflowY: 'scroll',
    height: 400,
    width: 400,
    flexGrow: 1,
    margin: '16px auto',
  },
  searchContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: 20,
    '& > *:not(:last-child)': {
      marginRight: 8,
    },
  },
});

export default function FollowingComponent() {
  const classes = useStyles();
  const [filter, setFilter] = useState('');
  const { storage, loading, setStorage } = useContext(StorageContext);
  const { filteredChannels: channels } = useContext(BackgroundPortContext);

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

  function filterFn(channel: Channel) {
    const hasUsername = 'username' in channel
      && channel.username.toLowerCase().includes(filter.trim().toLowerCase());
    const hasDisplayName = channel.displayName.toLowerCase().includes(filter.trim().toLowerCase());
    const hasCustomUrl = channel.type === ChannelType.YOUTUBE
      && channel.customUrl?.toLowerCase().includes(filter.trim().toLowerCase());
    return hasUsername || hasDisplayName || hasCustomUrl;
  }

  const searchContainer = (
    <div className={classes.searchContainer}>
      <TextField
        placeholder="Search..."
        variant="outlined"
        size="small"
        value={filter}
        onChange={e => setFilter(e.target.value)}
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
        select
        onChange={handleSortChange}
      >
        <MenuItem value={1}>Lowest</MenuItem>
        <MenuItem value={0}>Highest</MenuItem>
      </TextField>
    </div>
  );

  if (loading) {
    return (
      <>
        {searchContainer}
        <List dense className={classes.listContainer}>
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
      <List dense className={classes.listContainer}>
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
