import browser from 'webextension-polyfill';
import { useAtomValue } from 'jotai';
import { Route, useHistory } from 'react-router-dom';
import { Box, Button, Typography, useTheme } from '@mui/material';

import { IsFullscreenAtom } from 'src/ui/atoms/IsFullscreen';
import Following from 'src/ui/components/Following';
import Sidebar from 'src/ui/components/Sidebar';
import Accounts from 'src/ui/components/Accounts';
import Preferences from 'src/ui/components/Preferences';
import Permissions from 'src/ui/components/Permissions';
import Favorites from 'src/ui/components/Favorites';
import AddChannels from 'src/ui/components/AddChannels';
import HideChannels from 'src/ui/components/HideChannels';
import ImportExportSettings from 'src/ui/components/ImportExportSettings';
import PlatformButtonIcon from 'src/ui/widgets/PlatformButtonIcon';
import { MessageType, AccountType, OriginType } from 'src/types';
import { ORIGINS } from 'src/app-constants';
import { useAuth } from 'src/ui/hooks';
import { POPUP_HEIGHT } from 'src/ui/components/App';

const MAX_POPUP_WIDTH = 800;
const FULL_SCREEN_WIDTH = 950;
const POPUP_SIDEBAR_WIDTH = 303;
const FULLSCREEN_SIDEBAR_WIDTH = 303;

function Home() {
  const isFullscreen = useAtomValue(IsFullscreenAtom);
  const sidebarWidth = isFullscreen ? FULLSCREEN_SIDEBAR_WIDTH : POPUP_SIDEBAR_WIDTH;
  const pageWidth = isFullscreen ? FULL_SCREEN_WIDTH : MAX_POPUP_WIDTH;

  const theme = useTheme();
  const border = `1px solid ${theme.palette.divider}`;

  const history = useHistory();
  const { loading, loggedIn } = useAuth();

  function login(type: MessageType) {
    browser.permissions.request({
      origins: [ORIGINS[OriginType.TWITCH]],
    });
    // Due to a bug in Firefox where the permissions request is hidden behind the extension popup,
    // do not wait for the permission request to be completed before attempting to log in.
    browser.runtime.sendMessage({ type });
  }

  return (
    <Box
      width={pageWidth}
      height="100%"
      overflow="hidden"
      sx={{ backgroundColor: theme.palette.background.paper }}
      borderLeft={isFullscreen ? border : undefined}
      borderRight={isFullscreen ? border : undefined}
    >
      <Box
        height="100%"
        display="flex"
        sx={{
          '&> *:not(:last-child)': {
            borderRight: border,
          },
        }}
      >
        <Box width={pageWidth - sidebarWidth} height="100%">
          {loggedIn || loading ? (
            <Following />
          ) : (
            <Box
              maxHeight={isFullscreen && !loggedIn ? POPUP_HEIGHT : undefined}
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
              gap="10px"
            >
              <Button
                color="primary"
                startIcon={<PlatformButtonIcon type={AccountType.TWITCH} />}
                variant="contained"
                onClick={() => login(MessageType.LOGIN_TWITCH)}
              >
                Log In with Twitch
              </Button>
              <Typography variant="body1">or</Typography>
              <Button
                color="primary"
                variant="contained"
                onClick={() => {
                  if (history.location.pathname !== '/accounts') history.push('/accounts');
                }}
              >
                Manage Accounts
              </Button>
            </Box>
          )}
        </Box>
        <Box width={sidebarWidth} height="100%">
          <Route exact path="/" component={Sidebar} />
          <Route exact path="/accounts" component={Accounts} />
          <Route exact path="/preferences" component={Preferences} />
          <Route exact path="/permissions" component={Permissions} />
          <Route exact path="/favorites" component={Favorites} />
          <Route exact path="/add-channels" component={AddChannels} />
          <Route exact path="/hide-channels" component={HideChannels} />
          <Route exact path="/import-export-settings" component={ImportExportSettings} />
        </Box>
      </Box>
    </Box>
  );
}

export default Home;
