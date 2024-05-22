import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import { makeStyles } from '@material-ui/core/styles';

const BUTTON_HEIGHT = 42;

const useStyles = makeStyles(theme => ({
  container: {
    width: '100%',
    height: '100%',
  },
  childrenContainer: {
    padding: 20,
    // 1 is for the divider
    height: `calc(100% - 1px - ${BUTTON_HEIGHT}px)`,
    // Flex so that the height of the children will stretch to take up the entire height (for scrollable views)
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  button: {
    textTransform: 'capitalize',
    display: 'flex',
    justifyContent: 'start',
    width: '100%',
    borderRadius: 0,
    // @ts-ignore This is a property that we include in our custom theme.
    backgroundColor: theme.palette.altBackground!.main,
  },
}));

const BackWrapper: React.FC = ({ children }) => {
  const classes = useStyles();
  const history = useHistory();
  const onBack = useCallback(() => {
    history.goBack();
  }, [history]);

  return (
    <div className={classes.container}>
      <Button size="large" onClick={onBack} className={classes.button} startIcon={<ArrowLeftIcon />}>
        Back
      </Button>
      <Divider />
      <div className={classes.childrenContainer}>
        {children}
      </div>
    </div>
  );
};

export default BackWrapper;
