import React, { useCallback, useContext } from 'react';
import type { SortEndHandler } from 'react-sortable-hoc';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { makeStyles } from '@material-ui/core/styles';
import { List, Typography } from '@material-ui/core';
import StarRoundedIcon from '@material-ui/icons/StarRounded';

import type { Channel } from 'types';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import ChannelItem from 'components/ChannelItem';
import BackgroundPortContext from 'contexts/BackgroundPort';

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
  item: {
    cursor: 'move',
  },
});

const FavoritesItem = SortableElement(ChannelItem);

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
          <FavoritesItem
            key={fav}
            index={index}
            className={classes.item}
            channel={channel}
            handleIconClick={handleRemoveFavorite}
            Icon={StarRoundedIcon}
          />
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
