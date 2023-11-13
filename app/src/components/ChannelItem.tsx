import React, { useCallback, useContext } from 'react';
import { browser } from 'webextension-polyfill-ts';
import { makeStyles } from '@material-ui/core/styles';
import { ListItem, ListItemIcon, ListItemText, Link } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import StarRoundedIcon from '@material-ui/icons/StarRounded';

import { ChannelType, Channel } from 'types';
import StorageContext from 'contexts/Storage';
import Hoverable from 'components/Hoverable';
import LiveCount from 'components/LiveCount';
import { getChannelUrl, getIsLoggedInWithMultipleAccounts } from 'utils';

const useStyles = makeStyles({
  icon: {
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
  itemTextSpan: {
    display: 'flex',
    alignItems: 'center',
  },
  twitchIcon: {
    height: 16,
    width: 16,
    marginLeft: 4,
  },
  youtubeIcon: {
    height: 12,
    width: 17,
    marginLeft: 6,
  },
  kickIcon: {
    height: 14,
    width: 14,
    marginLeft: 4,
  },
});

export interface ChannelItemProps {
  className?: string,
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
  className,
  showLiveCount = false,
}: Pick<ChannelItemProps, 'className' | 'showLiveCount'>) {
  const classes = useStyles();
  return (
    <ListItem dense divider className={className}>
      <Skeleton variant="rect" width={20} height={20} className={classes.profilePic} />
      <ListItemText className={classes.itemText}>
        <Skeleton variant="rect" width={60} height={20} />
      </ListItemText>
      {showLiveCount && <LiveCount loading />}
      <ListItemIcon>
        <Skeleton variant="circle" className={classes.icon} width={20} height={20} />
      </ListItemIcon>
    </ListItem>
  );
}

export default function ChannelItem({
  className,
  onIconClick,
  channel,
  Icon,
  iconColor,
  hoverable = false,
  linked = false,
  showLiveCount = false,
  hidePlatformIcon = false,
}: ChannelItemProps) {
  const classes = useStyles();
  const { storage } = useContext(StorageContext);

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

  const avatar = <img src={channel.profilePic} alt="avatar" className={classes.profilePic} />;
  const href = getChannelUrl(channel);
  const displayName = linked ? (
    <Link
      href={href}
      color="textPrimary"
      data-href={href}
      onClick={handleOpenLink}
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
        platformIcon = <img src={`${process.env.PUBLIC_URL}/twitch-icon.svg`} alt="" className={classes.twitchIcon} />;
        break;
      }
      case ChannelType.YOUTUBE: {
        platformIcon = <img src={`${process.env.PUBLIC_URL}/youtube-icon.svg`} alt="" className={classes.youtubeIcon} />;
        break;
      }
      case ChannelType.KICK: {
        platformIcon = <img src={`${process.env.PUBLIC_URL}/kick-icon.png`} alt="" className={classes.kickIcon} />;
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
      className={className}
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
      <ListItemText classes={{
        root: classes.itemText,
        primary: classes.itemTextSpan,
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
          className={classes.icon}
          color={iconColor}
          onClick={handleIconClick}
        />
      </ListItemIcon>
    </ListItem>
  );
}
