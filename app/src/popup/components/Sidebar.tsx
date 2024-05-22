import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
} from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';

// https://v4.mui.com/components/material-icons/
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import TuneIcon from '@material-ui/icons/Tune';
import StarRoundedIcon from '@material-ui/icons/StarRounded';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import GetAppIcon from '@material-ui/icons/GetApp';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

import { useStorage } from 'src/popup/stores/Storage';
import { TITLE, MessageType } from 'src/app-constants';
import { VoidFn } from 'src/types';
import { useAuth } from 'src/hooks';

const useStyles = makeStyles({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  linksContainer: {
    width: '100%',
  },
  rightArrows: {
    marginLeft: 'auto',
  },
  links: {
    color: 'inherit',
    textDecoration: 'inherit',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 0',
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    marginLeft: 10,
  },
  enableContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '8px 0',
  },
  switchSkeleton: {
    padding: '9px 12px',
  },
  donationContainer: {
    display: 'flex',
    flexGrow: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  donationImage: {
    width: '217px !important',
    height: '60px !important',
  },
});

interface SidebarLinkProps {
  route?: string;
  label: string;
  Icon: React.ComponentType;
  onClick?: VoidFn,
  disabled: boolean;
}

function SidebarLink({ route, label, Icon, onClick, disabled }: SidebarLinkProps) {
  const classes = useStyles();
  const item = (
    <ListItem button onClick={onClick} disabled={disabled}>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={label} />
      <ListItemIcon>
        <ArrowRightIcon className={classes.rightArrows} />
      </ListItemIcon>
    </ListItem>
  );
  return (route && !disabled) ? (
    <Link to={route} className={classes.links}>
      {item}
    </Link>
  ) : item;
}

function Sidebar() {
  const classes = useStyles();
  const { loading, loggedIn } = useAuth();
  const storage = useStorage(store => store.storage);
  const storageLoading = useStorage(store => store.loading);
  const setStorage = useStorage(store => store.setStorage);

  const actionsDisabled = loading || !loggedIn;

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <img src="/icons/icon128.png" alt="" className={classes.logo} />
        <Typography variant="h5" className={classes.title}>{TITLE}</Typography>
      </div>
      <div className={classes.enableContainer}>
        {storageLoading ? (
          <FormControlLabel
            control={(
              <div className={classes.switchSkeleton}>
                <Skeleton variant="rect" width={34} height={20} style={{ borderRadius: 40 }} />
              </div>
            )}
            label="Enable"
          />
        ) : (
          <FormControlLabel
            control={(
              <Switch
                checked={storage.enabled}
                onChange={e => setStorage({ enabled: e.target.checked })}
                disabled={actionsDisabled}
              />
            )}
            label="Enable"
          />
        )}
      </div>
      <Divider />
      <div className={classes.linksContainer}>
        <List component="nav">
          <SidebarLink route="/preferences" label="Preferences" Icon={TuneIcon} disabled={actionsDisabled} />
          <SidebarLink route="/favorites" label="Favorites" Icon={StarRoundedIcon} disabled={actionsDisabled} />
          <SidebarLink route="/add-channels" label="Add Channels" Icon={AddCircleIcon} disabled={actionsDisabled} />
          <SidebarLink route="/hide-channels" label="Hide Channels" Icon={VisibilityOffIcon} disabled={actionsDisabled} />
          <SidebarLink route="/import-export-settings" label="Import Settings" Icon={GetAppIcon} disabled={actionsDisabled} />
          <SidebarLink route="/accounts" label="Accounts" Icon={AccountCircleIcon} disabled={loading} />
        </List>
      </div>
      <Divider />
      <div className={classes.donationContainer}>
        <a
          href="https://www.buymeacoffee.com/ErianasVow"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png"
            alt="Buy Me A Coffee"
            className={classes.donationImage}
          />
        </a>
      </div>
    </div>
  );
}

export default Sidebar;
