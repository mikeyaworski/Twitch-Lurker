import React, { useCallback, useContext, useState } from 'react';
import { browser } from 'webextension-polyfill-ts';
import { makeStyles } from '@material-ui/core/styles';
import { MenuItem, TextField, List, ListItem, ListItemIcon, ListItemText, InputAdornment, Link, IconButton } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import SearchIcon from '@material-ui/icons/Search';
import StarRoundedIcon from '@material-ui/icons/StarRounded';
import StarBorderRoundedIcon from '@material-ui/icons/StarBorderRounded';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import ClearIcon from '@material-ui/icons/Clear';
import type { Channel } from 'types';
import Hoverable from 'components/Hoverable';
import LiveCount from 'components/LiveCount';
import StorageContext from 'contexts/Storage';
import BackgroundPortContext from 'contexts/BackgroundPort';
import { sortChannels } from 'utils';

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
  favoriteIcon: {
    marginLeft: 'auto',
    cursor: 'pointer',
  },
  profilePic: {
    width: 22,
    height: 22,
    minWidth: 22,
    marginRight: 8,
  },
  listItemText: {
    overflow: 'hidden',
  },
});

function getViewerCountText(viewerCount: number) {
  if (viewerCount < 1000) return viewerCount.toString();
  return `${Math.floor(viewerCount / 100) / 10}K`;
}

interface Props {
  loading: boolean;
}

export default function FollowingComponent({ loading }: Props) {
  const classes = useStyles();
  const [filter, setFilter] = useState('');
  const { storage, setStorage } = useContext(StorageContext);
  const { channels } = useContext(BackgroundPortContext);

  const handleRemoveFavorite: React.MouseEventHandler<SVGSVGElement> = useCallback(e => {
    setStorage({
      favorites: storage.favorites.filter(f => f !== e.currentTarget.dataset.username),
    });
  }, [setStorage, storage.favorites]);

  const handleAddFavorite: React.MouseEventHandler<SVGSVGElement> = useCallback(e => {
    setStorage({
      favorites: storage.favorites.concat(e.currentTarget.dataset.username!),
    });
  }, [setStorage, storage.favorites]);

  const handleOpenLink: React.MouseEventHandler<HTMLAnchorElement> = useCallback(e => {
    e.preventDefault();
    browser.tabs.create({
      url: `https://twitch.tv/${e.currentTarget.dataset.username}`,
      active: false,
    });
  }, []);

  const handleSortChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(e => {
    setStorage({
      sortLow: Boolean(e.target.value),
    });
  }, [setStorage]);

  function filterFn(channel: Channel) {
    return channel.username.toLowerCase().includes(filter.trim().toLowerCase())
      || channel.displayName.toLowerCase().includes(filter.trim().toLowerCase());
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
            <ListItem dense divider key={idx}>
              <Skeleton variant="rect" width={20} height={20} className={classes.profilePic} />
              <ListItemText className={classes.listItemText}>
                <Skeleton variant="rect" width={60} height={20} />
              </ListItemText>
              <LiveCount loading />
              <ListItemIcon>
                <Skeleton variant="circle" className={classes.favoriteIcon} width={20} height={20} />
              </ListItemIcon>
            </ListItem>
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
          .map(channel => (
            <ListItem dense divider key={channel.username}>
              {channel.profilePic && (
                storage.showPreviewOnHover ? (
                  <Hoverable channel={channel}>
                    <img src={channel.profilePic} alt="avatar" className={classes.profilePic} />
                  </Hoverable>
                ) : (
                  <img src={channel.profilePic} alt="avatar" className={classes.profilePic} />
                )
              )}
              <ListItemText className={classes.listItemText}>
                {storage.showPreviewOnHover ? (
                  <Hoverable channel={channel}>
                    <Link
                      href={`https://twitch.tv/${channel.username}`}
                      color="textPrimary"
                      data-username={channel.username}
                      onClick={handleOpenLink}
                    >
                      {channel.displayName}
                    </Link>
                  </Hoverable>
                ) : (
                  <Link
                    href={`https://twitch.tv/${channel.username}`}
                    color="textPrimary"
                    data-username={channel.username}
                    onClick={handleOpenLink}
                  >
                    {channel.displayName}
                  </Link>
                )}
              </ListItemText>
              {channel.viewerCount != null && (
                <LiveCount viewerCount={channel.viewerCount} />
              )}
              <ListItemIcon>
                {storage.favorites.includes(channel.username) ? (
                  <StarRoundedIcon
                    className={classes.favoriteIcon}
                    data-username={channel.username}
                    onClick={handleRemoveFavorite}
                  />
                ) : (
                  <StarBorderRoundedIcon
                    className={classes.favoriteIcon}
                    data-username={channel.username}
                    onClick={handleAddFavorite}
                  />
                )}
              </ListItemIcon>
            </ListItem>
          ))}
      </List>
    </>
  );
}
