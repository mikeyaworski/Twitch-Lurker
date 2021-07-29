import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, FormLabel, FormControlLabel, Switch, TextField } from '@material-ui/core';
import StorageContext from 'contexts/Storage';
import BackWrapper from 'components/Router/BackWrapper';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  input: {
    width: 60,
    marginLeft: 8,
  },
  switchesContainer: {
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
});

export default function Preferences() {
  const classes = useStyles();
  const {
    storage,
    handleShowPreviewOnHoverEnabledToggle,
    handleAutoMuteTabsToggle,
    handleAutoOpenTabsToggle,
    handleOpenTabsInBackgroundToggle,
    handlePollDelayChange,
    handleMaxStreamsChange,
  } = useContext(StorageContext);
  return (
    <BackWrapper>
      <div className={classes.container}>
        <Typography variant="h5" align="center">
          Preferences
        </Typography>
        <Typography variant="body1" style={{ marginTop: 24, textDecoration: 'underline' }}>
          For opening favorites:
        </Typography>
        <div className={classes.switchesContainer}>
          <FormControlLabel
            control={<Switch checked={storage.autoOpenTabs} onChange={handleAutoOpenTabsToggle} />}
            label={<FormLabel>Automatically open tabs</FormLabel>}
            labelPlacement="start"
          />
          <FormControlLabel
            control={<Switch checked={storage.openTabsInBackground} onChange={handleOpenTabsInBackgroundToggle} />}
            label={<FormLabel>Tabs open in background</FormLabel>}
            labelPlacement="start"
          />
          <FormControlLabel
            control={<Switch checked={storage.autoMuteTabs} onChange={handleAutoMuteTabsToggle} />}
            label={<FormLabel>Tabs are muted</FormLabel>}
            labelPlacement="start"
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <FormControlLabel
            control={<Switch checked={storage.showPreviewOnHover} onChange={handleShowPreviewOnHoverEnabledToggle} />}
            label={<FormLabel>Show preview on hover</FormLabel>}
            labelPlacement="start"
          />
        </div>
        <div>
          <div className={classes.row}>
            <FormLabel>Poll interval (m):</FormLabel>
            <TextField
              className={classes.input}
              type="number"
              value={storage.pollDelay}
              onChange={handlePollDelayChange}
              inputProps={{
                min: 1,
              }}
            />
          </div>
          <div className={classes.row}>
            <FormLabel>Max streams at once:</FormLabel>
            <TextField
              className={classes.input}
              type="number"
              value={storage.maxStreams}
              onChange={handleMaxStreamsChange}
              inputProps={{
                min: 0,
                max: 5,
              }}
            />
          </div>
        </div>
      </div>
    </BackWrapper>
  );
}
