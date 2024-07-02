import { useCallback, useState } from 'react';
import browser from 'webextension-polyfill';
import { ListItem, ListItemIcon, ListItemText, Link, Skeleton, SxProps, Theme, Box } from '@mui/material';
import { listItemTextClasses } from '@mui/material/ListItemText';
import StarRoundedIcon from '@mui/icons-material/StarRounded';

import { ChannelType, Channel } from 'src/types';
import { useStorage } from 'src/ui/stores/Storage';
import Hoverable from 'src/ui/components/Hoverable';
import LiveCount from 'src/ui/components/LiveCount';
import { getChannelUrl, getIsLoggedInWithMultipleAccounts } from 'src/utils';

const AVATAR_SIZE = 22;

const profilePicSizingStyle = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  minWidth: AVATAR_SIZE,
};

const iconStyle = {
  marginLeft: 'auto',
  cursor: 'pointer',
};

const itemTextStyle = {
  overflow: 'hidden',
};

export interface ChannelItemProps {
  sx?: SxProps<Theme>,
  channel: Channel;
  onIconClick: (channel: Channel) => void;
  Icon: typeof StarRoundedIcon,
  iconColor?: React.ComponentProps<typeof StarRoundedIcon>['color'],
  hoverable?: boolean,
  linked?: boolean,
  showLiveCount?: boolean,
  hidePlatformIcon?: boolean,
}

export function ChannelItemSkeleton({
  sx,
  showLiveCount = false,
}: Pick<ChannelItemProps, 'sx' | 'showLiveCount'>) {
  return (
    <ListItem dense divider sx={sx}>
      <Skeleton variant="rectangular" width={20} height={20} sx={{ ...profilePicSizingStyle, mr: 1 }} />
      <ListItemText sx={itemTextStyle}>
        <Skeleton variant="rectangular" width={60} height={20} />
      </ListItemText>
      {showLiveCount && <LiveCount loading />}
      <ListItemIcon>
        <Skeleton variant="rounded" sx={iconStyle} width={20} height={20} />
      </ListItemIcon>
    </ListItem>
  );
}

export default function ChannelItem({
  sx,
  onIconClick,
  channel,
  Icon,
  iconColor,
  hoverable = false,
  linked = false,
  showLiveCount = false,
  hidePlatformIcon = false,
}: ChannelItemProps) {
  const storage = useStorage(store => store.storage);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  const handleOpenLink: React.MouseEventHandler<HTMLAnchorElement> = useCallback(e => {
    e.preventDefault();
    browser.tabs.create({
      url: e.currentTarget.dataset.href,
      active: false,
    });
  }, []);

  const handleIconClick = useCallback(() => {
    onIconClick(channel);
  }, [onIconClick, channel]);

  const handleAvatarLoaded = useCallback(() => {
    setAvatarLoaded(true);
  }, []);

  const avatar = (
    <Box display="flex" position="relative" mr={1}>
      {!avatarLoaded && (
        <Skeleton
          variant="rectangular"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            ...profilePicSizingStyle,
          }}
        />
      )}
      <Box
        component="img"
        src={channel.profilePic}
        alt=""
        loading="lazy"
        onLoad={handleAvatarLoaded}
        onError={handleAvatarLoaded}
        visibility={avatarLoaded ? 'visible' : 'hidden'}
        sx={profilePicSizingStyle}
      />
    </Box>
  );
  const href = getChannelUrl(channel);
  const displayName = linked ? (
    <Link
      href={href}
      color="textPrimary"
      data-href={href}
      onClick={handleOpenLink}
      underline="hover"
    >
      {channel.displayName}
    </Link>
  ) : (
    <>{channel.displayName}</>
  );

  let platformIcon: React.ReactNode = null;
  if (getIsLoggedInWithMultipleAccounts(storage.logins) && !hidePlatformIcon) {
    switch (channel.type) {
      case ChannelType.TWITCH: {
        platformIcon = (
          <img
            src="/twitch-icon.svg"
            alt=""
            loading="lazy"
            style={{
              height: 16,
              width: 16,
              marginLeft: 4,
            }}
          />
        );
        break;
      }
      case ChannelType.YOUTUBE: {
        platformIcon = (
          <img
            src="/youtube-icon.svg"
            alt=""
            loading="lazy"
            style={{
              height: 12,
              width: 17,
              marginLeft: 6,
            }}
          />
        );
        break;
      }
      case ChannelType.KICK: {
        platformIcon = (
          <img
            src="/kick-icon.png"
            alt=""
            loading="lazy"
            style={{
              height: 14,
              width: 14,
              marginLeft: 4,
            }}
          />
        );
        break;
      }
      default: {
        break;
      }
    }
  }

  return (
    <ListItem
      dense
      divider
      sx={sx}
    >
      {channel.profilePic && (
        storage.showPreviewOnHover && hoverable ? (
          <Hoverable channel={channel}>
            {avatar}
          </Hoverable>
        ) : (
          avatar
        )
      )}
      <ListItemText sx={{
        ...itemTextStyle,
        [`& .${listItemTextClasses.primary}`]: {
          display: 'flex',
          alignItems: 'center',
        },
      }}
      >
        {storage.showPreviewOnHover && hoverable ? (
          <Hoverable channel={channel}>
            {displayName}
          </Hoverable>
        ) : (
          displayName
        )}
        {platformIcon}
      </ListItemText>
      {showLiveCount && channel.viewerCount != null && (
        <LiveCount viewerCount={channel.viewerCount} />
      )}
      <ListItemIcon>
        <Icon
          sx={iconStyle}
          color={iconColor}
          onClick={handleIconClick}
        />
      </ListItemIcon>
    </ListItem>
  );
}
