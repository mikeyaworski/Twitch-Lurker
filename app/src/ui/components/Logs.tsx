import { useCallback } from 'react';
import copy from 'copy-to-clipboard';
import {
  Box,
  Typography,
  Collapse,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from '@mui/material';

import { useStorage } from 'src/ui/stores/Storage';
import { useConfirmationModal, useTemporaryToggle, useToggleState } from 'src/ui/hooks';
import { clearLogs, getLogs } from 'src/logging';
import BackWrapper from './Router/BackWrapper';

export default function Logs() {
  const theme = useTheme();
  const storageLocal = useStorage(store => store.storageLocal);
  const { value: exported, setValue: setExported } = useToggleState(false);
  const { value: cleared, setValue: setCleared } = useToggleState(false);

  useTemporaryToggle({
    value: cleared,
    setValue: setCleared,
  });
  useTemporaryToggle({
    value: exported,
    setValue: setExported,
  });

  const {
    open: openConfirmationModal,
    node: confirmationModal,
  } = useConfirmationModal({
    confirmColor: 'primary',
    confirmText: 'Clear',
  });

  const handleClear = useCallback(async () => {
    openConfirmationModal({
      title: 'Clear all logs?',
      onConfirm: clearLogs,
    });
  }, [openConfirmationModal]);

  const handleCopy = useCallback(async () => {
    const logs = await getLogs();
    copy(JSON.stringify(logs));
    setExported(true);
  }, [setExported]);

  return (
    <BackWrapper>
      {confirmationModal}
      <Typography variant="h5" align="center" gutterBottom>Logs</Typography>
      {storageLocal.logs.length > 0 ? (
        // @ts-ignore This is a property that we include in our custom theme.
        <List dense sx={{ width: '100%', overflow: 'auto', backgroundColor: theme.palette.altBackground.main }}>
          {storageLocal.logs.slice(0).reverse().map((logItem, i, allLogs) => (
            // eslint-disable-next-line react/no-array-index-key
            <ListItem key={logItem + i}>
              <ListItemText primary={`${allLogs.length - i}. ${logItem}`} sx={{ whiteSpace: 'nowrap' }} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1">
          Logs are empty.
        </Typography>
      )}
      <Box mt={1} />
      <Box display="flex" alignItems="center" gap="5px">
        <Button size="small" color="primary" variant="contained" onClick={handleClear} disabled={!storageLocal.logs.length}>
          Clear
        </Button>
        <Button size="small" color="primary" variant="contained" onClick={handleCopy} disabled={!storageLocal.logs.length}>
          Export
        </Button>
      </Box>
      <Collapse in={exported}>
        <Alert
          severity="success"
          variant="filled"
          sx={{ mt: 1 }}
        >
          Logs copied to clipboard!
        </Alert>
      </Collapse>
      <Collapse in={cleared}>
        <Alert
          severity="success"
          variant="filled"
          sx={{ mt: 1 }}
        >
          Logs cleared.
        </Alert>
      </Collapse>
    </BackWrapper>
  );
}
