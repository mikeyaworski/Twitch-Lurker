import React, { useCallback, useContext } from 'react';
import { browser } from 'webextension-polyfill-ts';
import { makeStyles } from '@material-ui/core/styles';
import { ListItem, ListItemIcon, ListItemText, Link } from '@material-ui/core';
import StarRoundedIcon from '@material-ui/icons/StarRounded';
import Skeleton from '@material-ui/lab/Skeleton';

import type { Channel, SvgClickEventHandler } from 'types';
import StorageContext from 'contexts/Storage';
import Hoverable from 'components/Hoverable';
import LiveCount from 'components/LiveCount';

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
});

export interface ChannelItemProps {
  className?: string,
  channel: Channel;
  handleIconClick: SvgClickEventHandler;
  Icon: typeof StarRoundedIcon,
  iconColor?: React.ComponentProps<typeof StarRoundedIcon>['color'],
  hoverable?: boolean,
  linked?: boolean,
  showLiveCount?: boolean,
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
  handleIconClick,
  channel,
  Icon,
  iconColor,
  hoverable = false,
  linked = false,
  showLiveCount = false,
}: ChannelItemProps) {
  const classes = useStyles();
  const { storage } = useContext(StorageContext);

  const handleOpenLink: React.MouseEventHandler<HTMLAnchorElement> = useCallback(e => {
    e.preventDefault();
    browser.tabs.create({
      url: `https://twitch.tv/${e.currentTarget.dataset.username}`,
      active: false,
    });
  }, []);

  const avatar = <img src={channel.profilePic} alt="avatar" className={classes.profilePic} />;
  const displayName = linked ? (
    <Link
      href={`https://twitch.tv/${channel.username}`}
      color="textPrimary"
      data-username={channel.username}
      onClick={handleOpenLink}
    >
      {channel.displayName}
    </Link>
  ) : (
    <>{channel.displayName}</>
  );

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
      <ListItemText className={classes.itemText}>
        {storage.showPreviewOnHover && hoverable ? (
          <Hoverable channel={channel}>
            {displayName}
          </Hoverable>
        ) : (
          displayName
        )}
      </ListItemText>
      {showLiveCount && channel.viewerCount != null && (
        <LiveCount viewerCount={channel.viewerCount} />
      )}
      <ListItemIcon>
        <Icon
          className={classes.icon}
          color={iconColor}
          data-username={channel.username}
          onClick={handleIconClick}
        />
      </ListItemIcon>
    </ListItem>
  );
}
