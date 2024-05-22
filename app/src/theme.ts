import Color from 'color';
import { createMuiTheme } from '@material-ui/core/styles';
import { THEME_COLOR } from 'src/app-constants';

const HOVER_THEME_COLOR = Color(THEME_COLOR).darken(0.1).hex();
const ACTIVE_THEME_COLOR = Color(THEME_COLOR).darken(0.15).hex();

declare module '@material-ui/core/styles/createPalette' {
  interface PaletteOptions {
    altBackground?: PaletteOptions['primary'];
  }
}

export default createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: THEME_COLOR,
      contrastText: '#FFFFFF',
    },
    altBackground: {
      main: '#484848',
      contrastText: '#FFFFFF',
    },
  },
  props: {
    MuiSwitch: {
      color: 'primary',
    },
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
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
      },
    },
    MuiFormLabel: {
      root: {
        color: '#FFFFFF',
      },
    },
    MuiTooltip: {
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
    MuiCardHeader: {
      root: {
        padding: 8,
      },
    },
    MuiButton: {
      root: {
        textTransform: 'none',
      },
    },
    MuiCardActions: {
      root: {
        flexWrap: 'wrap',
      },
    },
  },
});
