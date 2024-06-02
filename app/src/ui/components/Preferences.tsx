import { Box, Typography, FormLabel, FormControlLabel, Switch, TextField, IconButton, Tooltip } from '@mui/material';
import { useStorage } from 'src/ui/stores/Storage';
import BackWrapper from 'src/ui/components/Router/BackWrapper';
import ErrorIcon from '@mui/icons-material/Error';
import { requestNecessaryHostPermissions } from 'src/utils';
import { usePermissionIssues } from 'src/ui/hooks';

const rowStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
};

const inputStyles = {
  width: 60,
  marginLeft: 1,
};

const switchesContainerStyles = {
  marginBottom: 3,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
};

export default function Preferences() {
  const storage = useStorage(store => store.storage);
  const setStorage = useStorage(store => store.setStorage);

  const permissionIssues = usePermissionIssues();
  const hasPermissionIssues = Object.values(permissionIssues).includes(true);

  function onAutoOpenTabsChange(e: React.ChangeEvent<HTMLInputElement>) {
    setStorage({ autoOpenTabs: e.target.checked });
    if (e.target.checked) requestNecessaryHostPermissions(true);
  }

  return (
    <BackWrapper>
      <Box display="flex" alignItems="center" flexDirection="column">
        <Typography variant="h5" align="center">
          Preferences
        </Typography>
        <Typography variant="body1" mt={3} sx={{ textDecoration: 'underline' }}>
          For opening favorites:
        </Typography>
        <Box sx={switchesContainerStyles}>
          <Box display="flex" justifyContent="flex-end" alignItems="center">
            <Tooltip
              arrow
              title="You need to allow permissions for tabs to automatically open. Click the yellow icon to allow permissions."
            >
              <IconButton sx={{ p: 0, visibility: hasPermissionIssues ? 'visible' : 'hidden' }} onClick={() => requestNecessaryHostPermissions()}>
                <ErrorIcon color="warning" />
              </IconButton>
            </Tooltip>
            <FormControlLabel
              control={<Switch checked={storage.autoOpenTabs} onChange={onAutoOpenTabsChange} />}
              label={<FormLabel>Automatically open tabs</FormLabel>}
              labelPlacement="start"
            />
          </Box>
          <FormControlLabel
            control={<Switch checked={storage.openTabsInBackground} onChange={e => setStorage({ openTabsInBackground: e.target.checked })} />}
            label={<FormLabel>Tabs open in background</FormLabel>}
            labelPlacement="start"
          />
          <FormControlLabel
            control={<Switch checked={storage.autoMuteTabs} onChange={e => setStorage({ autoMuteTabs: e.target.checked })} />}
            label={<FormLabel>Tabs are muted</FormLabel>}
            labelPlacement="start"
          />
        </Box>
        <Box sx={switchesContainerStyles}>
          <FormControlLabel
            control={<Switch checked={storage.showPreviewOnHover} onChange={e => setStorage({ showPreviewOnHover: e.target.checked })} />}
            label={<FormLabel>Show preview on hover</FormLabel>}
            labelPlacement="start"
          />
          <FormControlLabel
            control={<Switch checked={storage.notifications} onChange={e => setStorage({ notifications: e.target.checked })} />}
            label={<FormLabel>Browser notifications</FormLabel>}
            labelPlacement="start"
          />
        </Box>
        <Box>
          <Box sx={rowStyles}>
            <FormLabel>Poll interval (m):</FormLabel>
            <TextField
              sx={inputStyles}
              type="number"
              variant="standard"
              value={storage.pollDelay}
              onChange={e => setStorage({ pollDelay: e.target.value })}
              inputProps={{
                min: 1,
              }}
            />
          </Box>
          <Box sx={rowStyles}>
            <FormLabel>Max streams at once:</FormLabel>
            <TextField
              sx={inputStyles}
              type="number"
              variant="standard"
              value={storage.maxStreams}
              onChange={e => setStorage({ maxStreams: e.target.value })}
              inputProps={{
                min: 0,
                max: 5,
              }}
            />
          </Box>
        </Box>
      </Box>
    </BackWrapper>
  );
}
