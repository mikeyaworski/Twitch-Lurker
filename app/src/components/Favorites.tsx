import React, { useCallback, useContext } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { makeStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import StarRoundedIcon from '@material-ui/icons/StarRounded';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';
import BackgroundPortContext from 'contexts/BackgroundPort';

const useStyles = makeStyles({
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

  const handleMoveFavorite = useCallback((result: DropResult) => {
    const newFavs = Array.from(storage.favorites);
    if (!result.destination) return;
    newFavs.splice(result.source.index, 1);
    newFavs.splice(result.destination.index, 0, storage.favorites[result.source.index]);
    setStorage({ favorites: newFavs }, true);
  }, [setStorage, storage.favorites]);

  return (
    <BackWrapper>
      <Typography variant="h5" align="center">Favorites</Typography>
      <DragDropContext onDragEnd={handleMoveFavorite}>
        <Droppable droppableId="favorites">
          {providedZone => (
            <List
              {...providedZone.droppableProps}
              ref={providedZone.innerRef}
              className={classes.scrollZone}
              dense
            >
              {storage.favorites.map((fav, index) => {
                const channel = channels.find(c => c.username === fav);
                if (!channel) return null;
                return (
                  <Draggable
                    key={fav}
                    draggableId={fav}
                    index={index}
                  >
                    {providedItem => (
                      <ListItem
                        ref={providedItem.innerRef}
                        {...providedItem.draggableProps}
                        {...providedItem.dragHandleProps}
                        dense
                        divider
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
                    )}
                  </Draggable>
                );
              })}
              {providedZone.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>
    </BackWrapper>
  );
}
