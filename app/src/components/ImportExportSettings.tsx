import React, { useContext, useCallback, useState } from 'react';
import copy from 'copy-to-clipboard';
import {
  Box,
  Typography,
  Collapse,
  Button,
  TextField,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

import { getStorage } from 'chrome-utils';
import StorageContext from 'contexts/Storage';
import { useTemporaryToggle, useToggleState } from 'hooks';
import { PREFERENCE_STORAGE_VALUES, PreferencesKey } from 'types';
import BackWrapper from './Router/BackWrapper';

export default function ImportExportSettings() {
  const { setStorage } = useContext(StorageContext);

  const [importValue, setImportValue] = useState('');
  const { value: exported, setValue: setExported } = useToggleState(false);
  const { value: imported, setValue: setImported } = useToggleState(false);

  useTemporaryToggle({
    value: imported,
    setValue: setImported,
  });
  useTemporaryToggle({
    value: exported,
    setValue: setExported,
  });

  const handleImportMapping = useCallback(() => {
    try {
      const json = JSON.parse(importValue);
      setStorage(json);
      setImported(true);
    } catch (err) {
      // do nothing
    }
  }, [setStorage, importValue, setImported]);

  const handleExportMapping = useCallback(async () => {
    const preferencesExport = await getStorage(Object.keys(PREFERENCE_STORAGE_VALUES) as PreferencesKey[]);
    copy(JSON.stringify(preferencesExport));
    setExported(true);
  }, [setExported]);

  return (
    <BackWrapper>
      <Typography variant="h5" align="center" gutterBottom>Import/Export Settings</Typography>
      <Box width="100%">
        <TextField
          style={{ marginBottom: 10 }}
          fullWidth
          label="Settings JSON"
          variant="outlined"
          value={importValue}
          onChange={e => setImportValue(e.target.value)}
          multiline
          rows={5}
        />
        <Box display="flex" alignItems="center" gridGap="5px">
          <Button size="small" color="primary" variant="contained" onClick={handleImportMapping}>
            Import
          </Button>
          <Button size="small" color="primary" variant="contained" onClick={handleExportMapping}>
            Export
          </Button>
        </Box>
        <Collapse in={exported}>
          <Alert
            severity="success"
            variant="filled"
            style={{
              marginTop: 10,
            }}
          >
            Copied to clipboard!
          </Alert>
        </Collapse>
        <Collapse in={imported}>
          <Alert
            severity="success"
            variant="filled"
            style={{
              marginTop: 10,
            }}
          >
            Imported!
          </Alert>
        </Collapse>
      </Box>
    </BackWrapper>
  );
}
