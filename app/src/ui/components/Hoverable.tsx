import React, { useState } from 'react';
import { Popover, Typography, Skeleton, useTheme, Box } from '@mui/material';
import { popoverClasses } from '@mui/material/Popover';
import { ChannelType, Channel } from 'src/types';
import { getStreamLength } from 'src/utils';

const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 169;

type Props = {
  children: React.ReactElement;
  channel: Channel,
}

function getThumbnailUrl(thumbnailTemplate: string) {
  return thumbnailTemplate.replace('{width}', String(THUMBNAIL_WIDTH)).replace('{height}', String(THUMBNAIL_HEIGHT));
}

const Hoverable = ({ children, channel }: Props) => {
  const theme = useTheme();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setImgLoaded(false);
  };

  const handleImageLoaded = () => {
    setImgLoaded(true);
  };

  let title: string | undefined;
  let category: string | undefined;
  let startUtcTimestamp = channel.start;
  switch (channel.type) {
    case ChannelType.TWITCH: {
      title = channel.title;
      category = channel.game;
      break;
    }
    case ChannelType.YOUTUBE: {
      title = channel.title;
      break;
    }
    case ChannelType.KICK: {
      title = channel.title;
      category = channel.category;
      if (channel.start) {
        startUtcTimestamp = new Date(new Date(channel.start).getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString();
      }
      break;
    }
    default: {
      break;
    }
  }

  if ((!title && !category)
    || !channel.thumbnail
    || !startUtcTimestamp) {
    return children;
  }

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: handlePopoverOpen,
        onMouseLeave: handlePopoverClose,
      })}
      <Popover
        sx={{
          pointerEvents: 'none',
          [`& .${popoverClasses.paper}`]: {
            padding: 1,
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'unset',
          },
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Box maxWidth={THUMBNAIL_WIDTH}>
          {title && (
            <Typography variant="body2" color="textPrimary">
              {title}
            </Typography>
          )}
          <Typography variant="body2" color="textSecondary">
            {category ? `${category} - ` : ''}{channel.viewerCount} viewers ({getStreamLength(startUtcTimestamp)})
          </Typography>
        </Box>
        <Box position="relative" minHeight={THUMBNAIL_HEIGHT} minWidth={THUMBNAIL_WIDTH}>
          {!imgLoaded && (
            <Skeleton
              variant="rectangular"
              width={THUMBNAIL_WIDTH}
              height={THUMBNAIL_HEIGHT}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          )}
          {open && (
            <Box
              component="img"
              display="block"
              src={getThumbnailUrl(channel.thumbnail)}
              alt=""
              loading="lazy"
              onLoad={handleImageLoaded}
              onError={handleImageLoaded}
              visibility={imgLoaded ? 'visible' : 'hidden'}
              maxWidth={THUMBNAIL_WIDTH}
            />
          )}
        </Box>
      </Popover>
    </>
  );
};

export default Hoverable;
