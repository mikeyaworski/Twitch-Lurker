import { useAtomValue } from 'jotai';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles, Box } from '@mui/material';
import Router from 'src/ui/components/Router';
import { useStorageInitialization } from 'src/ui/stores/Storage';
import { useChannelAtomsInitialization } from 'src/ui/atoms/Channels';
import { IsFullscreenAtom } from 'src/ui/atoms/IsFullscreen';
import theme, { globalStyles } from 'src/ui/theme';

export const POPUP_HEIGHT = 550;

const App: React.FC = () => {
  const isFullscreen = useAtomValue(IsFullscreenAtom);

  useStorageInitialization();
  useChannelAtomsInitialization();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={globalStyles} />
      <CssBaseline />
      <Box
        sx={{
          minHeight: POPUP_HEIGHT,
          height: isFullscreen ? '100vh' : POPUP_HEIGHT,
          display: isFullscreen ? 'flex' : undefined,
          alignItems: isFullscreen ? 'center' : undefined,
          justifyContent: isFullscreen ? 'center' : undefined,
        }}
      >
        <Router />
      </Box>
    </ThemeProvider>
  );
};

export default App;
