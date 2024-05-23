import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles, Paper } from '@mui/material';
import Router from 'src/popup/components/Router';
import { useStorageInitialization } from 'src/popup/stores/Storage';
import { useChannelAtomsInitialization } from 'src/popup/atoms/Channels';
import theme, { globalStyles } from 'src/theme';

const POPUP_HEIGHT = 550;

const App: React.FC = () => {
  useStorageInitialization();
  useChannelAtomsInitialization();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={globalStyles} />
      <CssBaseline />
      <Paper square sx={{ height: POPUP_HEIGHT }}>
        <Router />
      </Paper>
    </ThemeProvider>
  );
};

export default App;
