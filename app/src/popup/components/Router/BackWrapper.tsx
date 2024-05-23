import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button, Divider, useTheme } from '@mui/material';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';

const BUTTON_HEIGHT = 42;

const BackWrapper: React.FC = ({ children }) => {
  const theme = useTheme();
  const history = useHistory();
  const onBack = useCallback(() => {
    history.goBack();
  }, [history]);

  return (
    <Box width="100%" height="100%">
      <Button
        size="large"
        onClick={onBack}
        sx={{
          textTransform: 'capitalize',
          display: 'flex',
          justifyContent: 'start',
          width: '100%',
          borderRadius: 0,
          // @ts-ignore This is a property that we include in our custom theme.
          backgroundColor: theme.palette.altBackground!.main,
        }}
        startIcon={<ArrowLeftIcon />}
      >
        Back
      </Button>
      <Divider />
      <Box
        p={2.5}
        // 1 is for the divider
        height={`calc(100% - 1px - ${BUTTON_HEIGHT}px)`}
        // Flex so that the height of the children will stretch to take up the entire height (for scrollable views)
        display="flex"
        flexDirection="column"
        sx={{ overflowY: 'auto' }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default BackWrapper;
