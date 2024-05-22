import {
  withStyles,
  Theme,
} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { red } from '@material-ui/core/colors';

export enum PaletteButtonType {
  RED,
}

export function getPaletteButton(type: PaletteButtonType) {
  switch (type) {
    case PaletteButtonType.RED: {
      return withStyles((theme: Theme) => ({
        root: {
          color: theme.palette.getContrastText(red[500]),
          backgroundColor: red[500],
          '&:hover': {
            backgroundColor: red[700],
          },
        },
      }))(Button);
    }
    default: {
      return Button;
    }
  }
}
