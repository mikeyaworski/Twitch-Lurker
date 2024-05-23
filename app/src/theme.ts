import Color from 'color';
import { grey } from '@mui/material/colors';
import { switchClasses } from '@mui/material/Switch';
import { createTheme } from '@mui/material/styles';
import { THEME_COLOR } from 'src/app-constants';

const HOVER_THEME_COLOR = Color(THEME_COLOR).darken(0.1).hex();
const ACTIVE_THEME_COLOR = Color(THEME_COLOR).darken(0.15).hex();
const BACKGROUND_COLOR = '#424242';
const ALT_BACKGROUND_COLOR = '#484848';

export const globalStyles = {
  margin: 0,
  /* Firefox quirks */
  backgroundColor: BACKGROUND_COLOR,
  overflow: 'hidden',

  // Scrollbar
  '::-webkit-scrollbar': {
    width: '0.4em',
    backgroundColor: 'rgba(255, 255, 255, 0.23)',
  },
  '::-webkit-scrollbar-track': {
    '-webkit-box-shadow': 'inset 0 0 6px rgba(0,0,0,0.00)',
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: THEME_COLOR,
    outline: `1px solid ${THEME_COLOR}`,
  },
  '::-webkit-scrollbar-thumb:hover': {
    backgroundColor: HOVER_THEME_COLOR, // '#815fc0',
    outline: `1px solid ${HOVER_THEME_COLOR}`,
  },
  '*::-webkit-scrollbar-thumb:active': {
    backgroundColor: ACTIVE_THEME_COLOR, // '#6034b2',
    outline: `1px solid ${ACTIVE_THEME_COLOR}`,
  },
};

declare module '@mui/material/styles' {
  interface PaletteOptions {
    default?: PaletteOptions['primary'];
    altBackground?: PaletteOptions['primary'];
  }
}

export default createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: THEME_COLOR,
      contrastText: '#FFFFFF',
    },
    default: {
      main: grey[300],
      contrastText: '#000000',
    },
    background: {
      default: BACKGROUND_COLOR,
      paper: BACKGROUND_COLOR,
    },
    altBackground: {
      main: ALT_BACKGROUND_COLOR,
      contrastText: '#FFFFFF',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: ALT_BACKGROUND_COLOR,
          backgroundImage: 'unset',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
        },
      },
    },
    MuiSwitch: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        colorPrimary: {
          [`&.${switchClasses.checked}&.${switchClasses.disabled}`]: {
            color: BACKGROUND_COLOR,
          },
          [`&.${switchClasses.disabled} + .${switchClasses.track}`]: {
            backgroundColor: '#FFFFFF',
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem',
        },
        tooltipPlacementTop: {
          marginBottom: 0,
        },
        tooltipPlacementBottom: {
          marginTop: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
      defaultProps: {
        // This is our custom palette color
        // @ts-expect-error
        color: 'default',
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          flexWrap: 'wrap',
        },
      },
    },
  },
});
