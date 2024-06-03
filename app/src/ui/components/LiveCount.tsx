import { Box, Skeleton, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const liveIconStyles = {
  color: 'red',
  minWidth: 0,
  marginRight: 0.5,
};

const liveCountStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
};

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
  if (loading) {
    return (
      <Box sx={liveCountStyles}>
        <Skeleton variant="rounded" width={20} height={20} sx={liveIconStyles} />
        <Skeleton variant="rectangular" width={30} height={18} />
      </Box>
    );
  }

  return (
    <Box sx={liveCountStyles}>
      <FiberManualRecordIcon sx={liveIconStyles} />
      <Typography variant="body2">
        {getViewerCountText(viewerCount!)}
      </Typography>
    </Box>
  );
}
