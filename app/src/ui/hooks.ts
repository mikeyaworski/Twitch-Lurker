import { useCallback, useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { useStorage } from 'src/ui/stores/Storage';
import { usePermissions } from 'src/ui/stores/Permissions';
import { getIsLoggedInWithAnyAccount } from 'src/utils';
import { AccountType, OriginType } from 'src/types';

export function useOpen(initial = false) {
  const [open, setOpen] = useState<boolean>(initial);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  return {
    open,
    handleOpen,
    handleClose,
  };
}

export function useToggleState(initial = false) {
  const [value, setValue] = useState<boolean>(initial);
  const handleToggle = useCallback(() => setValue((oldValue: boolean) => !oldValue), []);
  return {
    value,
    handleToggle,
    setValue,
  };
}

export function useTemporaryToggle({
  value,
  setValue,
  timeoutMs = 5000,
}: {
  value: boolean,
  setValue: (newValue: boolean) => void,
  timeoutMs?: number,
}): void {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (value) {
      timeoutId = setTimeout(() => {
        setValue(false);
      }, timeoutMs);
    }
    return () => clearTimeout(timeoutId);
  }, [value, setValue, timeoutMs]);
}

/**
 * Returns boolean representing whether the UI should be rendered (they are logged in).
 */
export function useAuth(): { loading: boolean, loggedIn?: boolean } {
  const loading = useStorage(store => store.loading);
  const storage = useStorage(store => store.storage);
  if (loading) return { loading };
  if (!getIsLoggedInWithAnyAccount(storage.logins)) return { loading, loggedIn: false };
  return { loading, loggedIn: true };
}

export function useHandleOpenLink(url: string, active = false): React.MouseEventHandler<HTMLAnchorElement> {
  const handleOpenLink: React.MouseEventHandler<HTMLAnchorElement> = useCallback(e => {
    e.preventDefault();
    browser.tabs.create({
      url,
      active,
    });
  }, [url, active]);
  return handleOpenLink;
}

type PermissionIssues = {
  [key in OriginType]: boolean
};
export function usePermissionIssues(): PermissionIssues {
  const permissionsLoading = usePermissions(store => store.loading);
  const origins = usePermissions(store => store.origins);
  const storage = useStorage(store => store.storage);
  const storageLoading = useStorage(store => store.loading);

  if (permissionsLoading || storageLoading) {
    return {
      [OriginType.TWITCH]: false,
      [OriginType.YOUTUBE]: false,
      [OriginType.KICK]: false,
    };
  }
  const hasTwitchAccount = storage.logins.some(login => login.type === AccountType.TWITCH);
  const hasYouTubeAccount = storage.logins.some(login => login.type === AccountType.YOUTUBE_API_KEY
    || login.type === AccountType.YOUTUBE);
  const hasKickAccount = storage.logins.some(login => login.type === AccountType.KICK);
  return {
    [OriginType.TWITCH]: storage.autoOpenTabs && hasTwitchAccount && !origins[OriginType.TWITCH],
    // The tradeoff for YouTube permissions being too granular is user experience vs being technically correct.
    // Technically, we don't all of the YouTube host permissions when they have a YouTube account.
    // E.g. we don't need the googleapis.com host permission if they only have an API key and are not logged in with a YouTube account.
    // E.g. we don't need the youtube.com host permission if we are not auto opening tabs for YouTube.
    // But to make it simpler for the users, we won't create so many granular permission requests.
    [OriginType.YOUTUBE]: hasYouTubeAccount && !origins[OriginType.YOUTUBE],
    // TODO: When this supports auto opening tabs, enable this error states
    [OriginType.KICK]: false && hasKickAccount && !origins[OriginType.KICK],
  };
}
