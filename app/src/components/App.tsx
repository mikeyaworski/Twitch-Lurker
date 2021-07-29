import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';
import { ThemeProvider } from '@material-ui/core/styles';
import Router from 'components/Router';
import StorageContext, { useStorage } from 'contexts/Storage';
import BackgroundPortContext, { useBackgroundPort } from 'contexts/BackgroundPort';
import theme from 'theme';

const POPUP_HEIGHT = 550;

const App: React.FC = () => {
  const storageData = useStorage();
  const backgroundPortData = useBackgroundPort();

  return (
    <StorageContext.Provider value={storageData}>
      <BackgroundPortContext.Provider value={backgroundPortData}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Paper square style={{ height: POPUP_HEIGHT }}>
            <Router />
          </Paper>
        </ThemeProvider>
      </BackgroundPortContext.Provider>
    </StorageContext.Provider>
  );
};

export default App;
