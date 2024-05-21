import { useCallback, useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { useStorage } from 'stores/Storage';
import { getIsLoggedInWithAnyAccount } from 'utils';

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
