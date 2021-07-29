import { useContext, useCallback, useState, useEffect } from 'react';
import StorageContext from 'contexts/Storage';

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

/**
 * Returns boolean representing whether the UI should be rendered (they are logged in).
 */
export function useAuth(): { loading: boolean, loggedIn?: boolean } {
  const { loading, storage } = useContext(StorageContext);
  if (loading) return { loading };
  if (!storage.accessToken || !storage.userId) return { loading, loggedIn: false };
  return { loading, loggedIn: true };
}
