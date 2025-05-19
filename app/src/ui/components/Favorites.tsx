import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import type { SortEndHandler } from 'react-sortable-hoc';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { List, Typography } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';

import type { Channel, Favorite } from 'src/types';
import { useStorage } from 'src/ui/stores/Storage';
import BackWrapper from 'src/ui/components/Router/BackWrapper';
import ChannelItem from 'src/ui/components/ChannelItem';
import { ChannelsAtom } from 'src/ui/atoms/Channels';
import { getFavoriteKey, getFavoriteValue, getFormattedFavorites } from 'src/utils';

const FavoritesItem = SortableElement(ChannelItem);

interface FavoritesListProps {
  favorites: Favorite[];
  channels: Channel[];
  onRemoveFavorite: (channel: Channel) => void;
}

const FavoritesList = SortableContainer(({ favorites, channels, onRemoveFavorite }: FavoritesListProps) => {
  return (
    <List
      sx={{
        overflowY: 'scroll',
        width: '100%',
        flexGrow: 1,
        mx: 'auto',
        my: 2,
      }}
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
            sx={{
              cursor: 'move',
              pointerEvents: 'auto !important',
            }}
            channel={channel}
            onIconClick={onRemoveFavorite}
            Icon={StarRoundedIcon}
            // Not enough space for the live count. The sidebar is small enough that the username text will get clipped.
            showLiveCount={false}
          />
        );
      })}
    </List>
  );
});

export default function Favorites() {
  const storage = useStorage(store => store.storage);
  const setStorage = useStorage(store => store.setStorage);
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
        // helperClass={classes.helperClass}
        distance={1}
        channels={channels || []}
        favorites={getFormattedFavorites(storage.favorites)}
        onRemoveFavorite={handleRemoveFavorite}
        onSortEnd={handleMoveFavorite}
      />
    </BackWrapper>
  );
}
