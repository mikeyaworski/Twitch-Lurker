import browser from 'webextension-polyfill';
import { Route, useHistory } from 'react-router-dom';
import { Box, Button, Typography, Theme, useTheme } from '@mui/material';

import Following from 'src/popup/components/Following';
import Sidebar from 'src/popup/components/Sidebar';
import Accounts from 'src/popup/components/Accounts';
import Preferences from 'src/popup/components/Preferences';
import Favorites from 'src/popup/components/Favorites';
import AddChannels from 'src/popup/components/AddChannels';
import HideChannels from 'src/popup/components/HideChannels';
import ImportExportSettings from 'src/popup/components/ImportExportSettings';
import PlatformButtonIcon from 'src/popup/widgets/PlatformButtonIcon';
import { MessageType } from 'src/app-constants';
import { useAuth } from 'src/hooks';
import { AccountType } from 'src/types';

const MAX_POPUP_WIDTH = 800;
export const SIDEBAR_WIDTH = 303;

function Home() {
  const history = useHistory();
  const theme = useTheme();
  const { loading, loggedIn } = useAuth();

  function login(type: MessageType) {
    browser.runtime.sendMessage({ type });
  }

  return (
    <Box
      width={MAX_POPUP_WIDTH}
      height="100%"
      overflow="hidden"
      sx={{ backgroundColor: theme.palette.background.paper }}
    >
      <Box
        height="100%"
        display="flex"
        sx={{
          '&> *:not(:last-child)': {
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box width={MAX_POPUP_WIDTH - SIDEBAR_WIDTH} height="100%">
          {loggedIn || loading ? (
            <Following />
          ) : (
            <Box height="100%" display="flex" alignItems="center" justifyContent="center" flexDirection="column" gap="10px">
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
        <Box width={SIDEBAR_WIDTH} height="100%">
          <Route exact path="/" component={Sidebar} />
          <Route exact path="/accounts" component={Accounts} />
          <Route exact path="/preferences" component={Preferences} />
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
