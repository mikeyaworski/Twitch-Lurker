import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';
import { ThemeProvider } from '@material-ui/core/styles';
import Router from 'components/Router';
import { useStorageInitialization } from 'stores/Storage';
import { useChannelAtomsInitialization } from 'atoms/Channels';
import theme from 'theme';

const POPUP_HEIGHT = 550;

const App: React.FC = () => {
  useStorageInitialization();
  useChannelAtomsInitialization();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper square style={{ height: POPUP_HEIGHT }}>
        <Router />
      </Paper>
    </ThemeProvider>
  );
};

export default App;
