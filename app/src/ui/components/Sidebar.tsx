import { Link } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Skeleton,
} from '@mui/material';
import { useAtomValue } from 'jotai';

// https://v4.mui.com/components/material-icons/
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import TuneIcon from '@mui/icons-material/Tune';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import GetAppIcon from '@mui/icons-material/GetApp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { IsFullscreenAtom } from 'src/ui/atoms/IsFullscreen';
import { useStorage } from 'src/ui/stores/Storage';
import { TITLE } from 'src/app-constants';
import { VoidFn } from 'src/types';
import { useAuth } from 'src/ui/hooks';

interface SidebarLinkProps {
  route?: string;
  label: string;
  Icon: React.ComponentType;
  onClick?: VoidFn,
  disabled: boolean;
}

function SidebarLink({ route, label, Icon, onClick, disabled }: SidebarLinkProps) {
  const item = (
    <ListItemButton onClick={onClick} disabled={disabled}>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={label} />
      <ListItemIcon>
        <ArrowRightIcon sx={{ marginLeft: 'auto' }} />
      </ListItemIcon>
    </ListItemButton>
  );
  return (route && !disabled) ? (
    <Box
      component={Link}
      to={route}
      sx={{
        color: 'inherit',
        textDecoration: 'inherit',
      }}
    >
      {item}
    </Box>
  ) : item;
}

function Sidebar() {
  const isFullscreen = useAtomValue(IsFullscreenAtom);
  const { loading, loggedIn } = useAuth();
  const storage = useStorage(store => store.storage);
  const storageLoading = useStorage(store => store.loading);
  const setStorage = useStorage(store => store.setStorage);

  const actionsDisabled = loading || !loggedIn;

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Box display="flex" alignItems="center" justifyContent="center" py={3}>
        <img
          src="/icons/icon128.png"
          alt=""
          width={32}
          height={32}
        />
        <Typography variant="h5" ml={1}>{TITLE}</Typography>
      </Box>
      <Box display="flex" justifyContent="center" my={1}>
        {storageLoading ? (
          <FormControlLabel
            control={(
              <Box py="9px" px="12px">
                <Skeleton variant="rectangular" width={34} height={20} style={{ borderRadius: 40 }} />
              </Box>
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
      </Box>
      <Divider />
      <Box width="100%">
        <List component="nav">
          <SidebarLink route="/preferences" label="Preferences" Icon={TuneIcon} disabled={actionsDisabled} />
          <SidebarLink route="/favorites" label="Favorites" Icon={StarRoundedIcon} disabled={actionsDisabled} />
          <SidebarLink route="/add-channels" label="Add Channels" Icon={AddCircleIcon} disabled={actionsDisabled} />
          <SidebarLink route="/hide-channels" label="Hide Channels" Icon={VisibilityOffIcon} disabled={actionsDisabled} />
          <SidebarLink route="/import-export-settings" label="Import Settings" Icon={GetAppIcon} disabled={actionsDisabled} />
          <SidebarLink route="/accounts" label="Accounts" Icon={AccountCircleIcon} disabled={loading} />
        </List>
      </Box>
      <Divider />
      <Box
        display="flex"
        flexGrow={isFullscreen ? 'unset' : 1}
        mt={isFullscreen ? 2 : 'unset'}
        alignItems="flex-end"
        justifyContent="center"
        pb={2.5}
      >
        <a
          href="https://www.buymeacoffee.com/ErianasVow"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png"
            alt="Buy Me A Coffee"
            width={217}
            height={60}
          />
        </a>
      </Box>
    </Box>
  );
}

export default Sidebar;
