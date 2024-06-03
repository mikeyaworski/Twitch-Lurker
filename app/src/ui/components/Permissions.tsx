import browser from 'webextension-polyfill';
import { Box, Typography, Card, CardContent, CardActions, Button, CardHeader, Tooltip } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import { usePermissions } from 'src/ui/stores/Permissions';
import BackWrapper from 'src/ui/components/Router/BackWrapper';
import { OriginType } from 'src/types';
import { ORIGINS } from 'src/app-constants';
import { usePermissionIssues } from 'src/ui/hooks';

interface OriginCardProps {
  type: OriginType,
}

function OriginCard({ type }: OriginCardProps) {
  const hostPermissions = usePermissions(store => store.origins);
  const permissionIssues = usePermissionIssues();

  const enabled = hostPermissions[type];
  const hasIssue = permissionIssues[type];

  let title = '';
  let issueTooltip = 'This permission is required to automatically open tabs';
  switch (type) {
    case OriginType.TWITCH: {
      title = 'Twitch';
      break;
    }
    case OriginType.YOUTUBE: {
      title = 'YouTube';
      issueTooltip = 'These permissions are required to automatically open tabs and fetch subscriptions';
      break;
    }
    case OriginType.KICK: {
      title = 'Kick';
      break;
    }
    default: break;
  }

  function request() {
    browser.permissions.request({
      origins: ORIGINS[type],
    });
  }

  function remove() {
    browser.permissions.remove({
      origins: ORIGINS[type],
    });
  }

  return (
    <Card>
      <CardHeader
        title={(
          <Typography gutterBottom variant="h6">
            {title}
          </Typography>
        )}
        action={hasIssue && (
          <Tooltip arrow title={issueTooltip}>
            <ErrorIcon color="warning" sx={{ cursor: 'pointer' }} />
          </Tooltip>
        )}
        sx={{ pt: 1.5, pb: 0 }}
      />
      <CardContent sx={{ pt: 0, pb: 0.5 }}>
        {ORIGINS[type].map(origin => (
          <Typography key={origin} variant="body2" color="lightgray">
            {origin}
          </Typography>
        ))}
      </CardContent>
      <CardActions>
        <Button variant="contained" size="small" color="primary" onClick={request} disabled={enabled}>
          Request
        </Button>
        <Button variant="contained" size="small" color="primary" onClick={remove} sx={{ display: 'none' }}>
          Remove
        </Button>
      </CardActions>
    </Card>
  );
}

export default function Permissions() {
  return (
    <BackWrapper>
      <Box display="flex" alignItems="center" flexDirection="column">
        <Typography variant="h5" align="center" gutterBottom>
          Permissions
        </Typography>
        <Typography variant="body2" color="lightgray" gutterBottom>
          These permissions allow the extension to see which tabs are open on a particular website.
        </Typography>
        <Typography variant="body2" color="lightgray">
          This is used when auto opening tabs, since the extension needs to know whether to open a new tab or replace an existing one.
        </Typography>
        <Box display="flex" flexDirection="column" gap="10px" width="100%" mt={1}>
          <OriginCard type={OriginType.TWITCH} />
          <OriginCard type={OriginType.YOUTUBE} />
          <OriginCard type={OriginType.KICK} />
        </Box>
      </Box>
    </BackWrapper>
  );
}
