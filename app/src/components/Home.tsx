import React, { useContext } from 'react';
import { Route } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';

import StorageContext from 'contexts/Storage';
import Following from 'components/Following';
import Sidebar from 'components/Sidebar';
import Preferences from 'components/Preferences';
import Favorites from 'components/Favorites';
import ImportExportSettings from 'components/ImportExportSettings';
import { MESSAGE_TYPES } from 'app-constants';
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
  center: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function Home() {
  const classes = useStyles();
  const { loading, loggedIn } = useAuth();
  const { loading: storageLoading } = useContext(StorageContext);

  function handleLogin() {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.LOGIN });
  }

  return (
    <div className={classes.root}>
      <div className={classes.row}>
        <div className={classes.followingContainer}>
          {loggedIn || loading ? (
            <Following loading={storageLoading} />
          ) : (
            <div className={classes.center}>
              <Button
                color="primary"
                startIcon={(
                  <img src={`${process.env.PUBLIC_URL}/login-icon.svg`} alt="" className={classes.loginIcon} />
                )}
                variant="contained"
                onClick={handleLogin}
              >
                Login with Twitch
              </Button>
            </div>
          )}
        </div>
        <div className={classes.sidebarContainer}>
          <Route exact path="/" component={Sidebar} />
          <Route exact path="/preferences" component={Preferences} />
          <Route exact path="/favorites" component={Favorites} />
          <Route exact path="/import-export-settings" component={ImportExportSettings} />
        </div>
      </div>
    </div>
  );
}

export default Home;
