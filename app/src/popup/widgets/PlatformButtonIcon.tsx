import { makeStyles } from '@material-ui/core';
import YouTubeIcon from '@material-ui/icons/YouTube';
import { AccountType } from 'src/types';

const useStyles = makeStyles({
  squareIcon: {
    width: 20,
    height: 20,
  },
  youtubeIcon: {
    width: 24,
    height: 24,
  },
});

interface Props {
  type: AccountType,
}

export default function PlatformButtonIcon({ type }: Props) {
  const classes = useStyles();
  switch (type) {
    case AccountType.YOUTUBE: {
      return (
        <YouTubeIcon className={classes.youtubeIcon} />
      );
    }
    case AccountType.TWITCH: {
      return (
        <img src="/twitch-icon-white.svg" alt="" className={classes.squareIcon} />
      );
    }
    default: {
      return null;
    }
  }
}
