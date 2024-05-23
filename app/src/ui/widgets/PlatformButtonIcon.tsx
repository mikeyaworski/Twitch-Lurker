import YouTubeIcon from '@mui/icons-material/YouTube';
import { AccountType } from 'src/types';

interface Props {
  type: AccountType,
}

export default function PlatformButtonIcon({ type }: Props) {
  switch (type) {
    case AccountType.YOUTUBE: {
      return (
        <YouTubeIcon width={24} height={24} />
      );
    }
    case AccountType.TWITCH: {
      return (
        <img src="/twitch-icon-white.svg" alt="" width={20} height={20} />
      );
    }
    default: {
      return null;
    }
  }
}
