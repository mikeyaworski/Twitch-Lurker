import { makeStyles } from '@material-ui/core/styles';
import { Typography, FormLabel, FormControlLabel, Switch, TextField } from '@material-ui/core';
import { useStorage } from 'src/popup/stores/Storage';
import BackWrapper from 'src/popup/components/Router/BackWrapper';

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
  const storage = useStorage(store => store.storage);
  const setStorage = useStorage(store => store.setStorage);
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
            control={<Switch checked={storage.autoOpenTabs} onChange={e => setStorage({ autoOpenTabs: e.target.checked })} />}
            label={<FormLabel>Automatically open tabs</FormLabel>}
            labelPlacement="start"
          />
          <FormControlLabel
            control={<Switch checked={storage.openTabsInBackground} onChange={e => setStorage({ openTabsInBackground: e.target.checked })} />}
            label={<FormLabel>Tabs open in background</FormLabel>}
            labelPlacement="start"
          />
          <FormControlLabel
            control={<Switch checked={storage.autoMuteTabs} onChange={e => setStorage({ autoMuteTabs: e.target.checked })} />}
            label={<FormLabel>Tabs are muted</FormLabel>}
            labelPlacement="start"
          />
        </div>
        <div className={classes.switchesContainer}>
          <FormControlLabel
            control={<Switch checked={storage.showPreviewOnHover} onChange={e => setStorage({ showPreviewOnHover: e.target.checked })} />}
            label={<FormLabel>Show preview on hover</FormLabel>}
            labelPlacement="start"
          />
          <FormControlLabel
            control={<Switch checked={storage.notifications} onChange={e => setStorage({ notifications: e.target.checked })} />}
            label={<FormLabel>Browser notifications</FormLabel>}
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
              onChange={e => setStorage({ pollDelay: e.target.value })}
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
              onChange={e => setStorage({ maxStreams: e.target.value })}
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
