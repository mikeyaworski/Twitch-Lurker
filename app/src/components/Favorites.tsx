import React, { useCallback, useContext } from 'react';
import { useAtomValue } from 'jotai';
import type { SortEndHandler } from 'react-sortable-hoc';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { makeStyles } from '@material-ui/core/styles';
import { List, Typography } from '@material-ui/core';
import StarRoundedIcon from '@material-ui/icons/StarRounded';

import type { Channel, Favorite } from 'types';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import ChannelItem from 'components/ChannelItem';
import { ChannelsAtom } from 'atoms/Channels';
import { getFavoriteKey, getFavoriteValue, getFormattedFavorites } from 'utils';

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
  favorites: Favorite[];
  channels: Channel[];
  onRemoveFavorite: (channel: Channel) => void;
}

const FavoritesList = SortableContainer(({ favorites, channels, onRemoveFavorite }: FavoritesListProps) => {
  const classes = useStyles();
  return (
    <List
      className={classes.scrollZone}
      dense
    >
      {favorites.map((fav, index) => {
        const favKey = fav.type + fav.value;
        const channel = channels.find(c => getFavoriteKey(c) === favKey);
        if (!channel) return null;
        return (
          <FavoritesItem
            key={favKey}
            index={index}
            className={classes.item}
            channel={channel}
            onIconClick={onRemoveFavorite}
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
  const channels = useAtomValue(ChannelsAtom);

  const handleRemoveFavorite = useCallback((channel: Channel) => {
    setStorage({
      favorites: getFormattedFavorites(storage.favorites).filter(f => f.type !== channel.type || f.value !== getFavoriteValue(channel)),
    });
  }, [setStorage, storage.favorites]);

  const handleMoveFavorite: SortEndHandler = useCallback(({ oldIndex, newIndex }) => {
    setStorage({ favorites: arrayMove(getFormattedFavorites(storage.favorites), oldIndex, newIndex) }, true);
  }, [setStorage, storage.favorites]);

  return (
    <BackWrapper>
      <Typography variant="h5" align="center">Favorites</Typography>
      <FavoritesList
        helperClass={classes.helperClass}
        distance={1}
        channels={channels}
        favorites={getFormattedFavorites(storage.favorites)}
        onRemoveFavorite={handleRemoveFavorite}
        onSortEnd={handleMoveFavorite}
      />
    </BackWrapper>
  );
}
