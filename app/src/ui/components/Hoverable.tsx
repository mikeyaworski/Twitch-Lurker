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

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleImageLoaded = () => {
    setImgLoaded(true);
  };

  const open = Boolean(anchorEl);

  let title: string | undefined;
  let startUtcTimestamp = channel.start;
  switch (channel.type) {
    case ChannelType.TWITCH: {
      title = channel.game;
      break;
    }
    case ChannelType.YOUTUBE: {
      title = channel.title;
      break;
    }
    case ChannelType.KICK: {
      title = channel.category || channel.title;
      if (channel.start) {
        startUtcTimestamp = new Date(new Date(channel.start).getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString();
      }
      break;
    }
    default: {
      break;
    }
  }

  if (!title
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
        <Typography variant="body2" color="textSecondary">
          {title} - {channel.viewerCount} viewers ({getStreamLength(startUtcTimestamp)})
        </Typography>
        {!imgLoaded && (
          <Skeleton variant="rectangular" width={THUMBNAIL_WIDTH} height={THUMBNAIL_HEIGHT} />
        )}
        <Box
          component="img"
          src={getThumbnailUrl(channel.thumbnail)}
          alt="Thumbnail"
          onLoad={handleImageLoaded}
          display={imgLoaded ? 'block' : 'none'}
          maxWidth={THUMBNAIL_WIDTH}
        />
      </Popover>
    </>
  );
};

export default Hoverable;
