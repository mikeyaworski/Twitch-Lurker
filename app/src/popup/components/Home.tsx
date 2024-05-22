import browser from 'webextension-polyfill';
import { Route, useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Button, Typography } from '@material-ui/core';

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

const useStyles = makeStyles(theme => ({
  root: {
    width: MAX_POPUP_WIDTH,
    height: '100%',
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
  },
  sidebarContainer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
  },
  row: {
    height: '100%',
    display: 'flex',
    '&> *:not(:last-child)': {
      borderRight: `1px solid ${theme.palette.divider}`,
    },
  },
  followingContainer: {
    width: MAX_POPUP_WIDTH - SIDEBAR_WIDTH,
    height: '100%',
  },
}));

function Home() {
  const classes = useStyles();
  const history = useHistory();
  const { loading, loggedIn } = useAuth();

  function login(type: MessageType) {
    browser.runtime.sendMessage({ type });
  }

  return (
    <div className={classes.root}>
      <div className={classes.row}>
        <div className={classes.followingContainer}>
          {loggedIn || loading ? (
            <Following />
          ) : (
            <Box height="100%" display="flex" alignItems="center" justifyContent="center" flexDirection="column" gridGap="10px">
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
        </div>
        <div className={classes.sidebarContainer}>
          <Route exact path="/" component={Sidebar} />
          <Route exact path="/accounts" component={Accounts} />
          <Route exact path="/preferences" component={Preferences} />
          <Route exact path="/favorites" component={Favorites} />
          <Route exact path="/add-channels" component={AddChannels} />
          <Route exact path="/hide-channels" component={HideChannels} />
          <Route exact path="/import-export-settings" component={ImportExportSettings} />
        </div>
      </div>
    </div>
  );
}

export default Home;
