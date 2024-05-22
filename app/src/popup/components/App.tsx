import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';
import { ThemeProvider } from '@material-ui/core/styles';
import Router from 'src/popup/components/Router';
import { useStorageInitialization } from 'src/popup/stores/Storage';
import { useChannelAtomsInitialization } from 'src/popup/atoms/Channels';
import theme from 'src/theme';

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
