import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import Skeleton from '@material-ui/lab/Skeleton';

const useStyles = makeStyles({
  liveIcon: {
    color: 'red',
    minWidth: 0,
    marginRight: 4,
  },
  liveCount: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

function getViewerCountText(viewerCount: number) {
  if (viewerCount < 1000) return viewerCount.toString();
  return `${Math.floor(viewerCount / 100) / 10}K`;
}

type Props = {
  viewerCount: number;
  loading?: undefined;
} | {
  viewerCount?: undefined;
  loading: boolean;
};

export default function FollowingComponent({ viewerCount, loading = false }: Props) {
  const classes = useStyles();

  if (loading) {
    return (
      <div className={classes.liveCount}>
        <Skeleton variant="circle" width={20} height={20} className={classes.liveIcon} />
        <Skeleton variant="rect" width={30} height={18} />
      </div>
    );
  }

  return (
    <div className={classes.liveCount}>
      <FiberManualRecordIcon className={classes.liveIcon} />
      {getViewerCountText(viewerCount!)}
    </div>
  );
}
