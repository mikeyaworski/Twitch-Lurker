import React from 'react';
import { browser } from 'webextension-polyfill-ts';
import { Route, useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Button, Typography } from '@material-ui/core';

import Following from 'components/Following';
import Sidebar from 'components/Sidebar';
import Accounts from 'components/Accounts';
import Preferences from 'components/Preferences';
import Favorites from 'components/Favorites';
import AddChannels from 'components/AddChannels';
import HideChannels from 'components/HideChannels';
import ImportExportSettings from 'components/ImportExportSettings';
import { MessageType } from 'app-constants';
import { useAuth } from 'hooks';

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
  loginIcon: {
    width: 20,
    height: 20,
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
                startIcon={(
                  <img src={`${process.env.PUBLIC_URL}/login-icon.svg`} alt="" className={classes.loginIcon} />
                )}
                variant="contained"
                onClick={() => login(MessageType.LOGIN_TWITCH)}
              >
                Login with Twitch
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
