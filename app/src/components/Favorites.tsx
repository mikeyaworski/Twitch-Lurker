import React, { useCallback, useContext } from 'react';
import type { SortEndHandler } from 'react-sortable-hoc';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { makeStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import StarRoundedIcon from '@material-ui/icons/StarRounded';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import BackgroundPortContext from 'contexts/BackgroundPort';
import type { Channel } from 'types';

const useStyles = makeStyles({
  helperClass: {
    // @ts-ignore Incorrect type error
    pointerEvents: 'auto !important',
  },
  scrollZone: {
    overflowY: 'scroll',
    height: 400,
    width: '100%',
    flexGrow: 1,
    margin: '16px auto',
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
  itemText: {
    overflow: 'hidden',
  },
  item: {
    cursor: 'move',
  },
});

interface FavoritesItemProps {
  fav: string;
  channel: Channel;
  handleRemoveFavorite: (e: React.SyntheticEvent<SVGElement>) => void;
}

const FavoritesItem = SortableElement(({ handleRemoveFavorite, channel, fav }: FavoritesItemProps) => {
  const classes = useStyles();
  return (
    <ListItem
      dense
      divider
      className={classes.item}
    >
      {channel.profilePic && (
        <img src={channel.profilePic} alt="avatar" className={classes.profilePic} />
      )}
      <ListItemText className={classes.itemText}>
        {channel.displayName}
      </ListItemText>
      <ListItemIcon>
        <StarRoundedIcon
          className={classes.favoriteIcon}
          data-username={fav}
          onClick={handleRemoveFavorite}
        />
      </ListItemIcon>
    </ListItem>
  );
});

interface FavoritesListProps {
  favorites: string[];
  channels: Channel[];
  handleRemoveFavorite: (e: React.SyntheticEvent<SVGElement>) => void;
}

const FavoritesList = SortableContainer(({ favorites, channels, handleRemoveFavorite }: FavoritesListProps) => {
  const classes = useStyles();
  return (
    <List
      className={classes.scrollZone}
      dense
    >
      {favorites.map((fav, index) => {
        const channel = channels.find(c => c.username === fav);
        if (!channel) return null;
        return (
          <FavoritesItem key={fav} index={index} fav={fav} channel={channel} handleRemoveFavorite={handleRemoveFavorite} />
        );
      })}
    </List>
  );
});

export default function Favorites() {
  const classes = useStyles();
  const { storage, setStorage } = useContext(StorageContext);
  const { channels } = useContext(BackgroundPortContext);

  const handleRemoveFavorite = useCallback((e: React.SyntheticEvent<SVGElement>) => {
    setStorage({
      favorites: storage.favorites.filter(f => f !== e.currentTarget.dataset.username),
    });
  }, [setStorage, storage.favorites]);

  const handleMoveFavorite: SortEndHandler = useCallback(({ oldIndex, newIndex }) => {
    setStorage({ favorites: arrayMove(storage.favorites, oldIndex, newIndex) }, true);
  }, [setStorage, storage.favorites]);

  return (
    <BackWrapper>
      <Typography variant="h5" align="center">Favorites</Typography>
      <FavoritesList
        helperClass={classes.helperClass}
        distance={1}
        channels={channels}
        favorites={storage.favorites}
        handleRemoveFavorite={handleRemoveFavorite}
        onSortEnd={handleMoveFavorite}
      />
    </BackWrapper>
  );
}
