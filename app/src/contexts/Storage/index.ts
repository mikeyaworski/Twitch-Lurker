import { createContext, useCallback, useEffect, useState } from 'react';
import merge from 'lodash.merge';
import type { Storage, StorageKeys } from 'types';
import { DEFAULT_STORAGE } from 'app-constants';
import { getStorage, hookStorage, setStorage as setStorageUtil } from 'chrome-utils';
import type {
  SetStorage,
  UseToggleFn,
  UseTextChangeFn,
} from './utils';
import {
  useToggleFn,
  useTextChangeFn,
} from './utils';

type UseStorage = {
  loading: boolean,
  storage: Storage,
  setStorage: SetStorage,
  handleShowPreviewOnHoverEnabledToggle: ReturnType<UseToggleFn>,
  handleExtensionEnabledToggle: ReturnType<UseToggleFn>,
  handleOpenTabsInBackgroundToggle: ReturnType<UseToggleFn>,
  handleAutoOpenTabsToggle: ReturnType<UseToggleFn>,
  handleAutoMuteTabsToggle: ReturnType<UseToggleFn>,
  handleNotificationsToggle: ReturnType<UseToggleFn>,
  handlePollDelayChange: ReturnType<UseTextChangeFn>,
  handleMaxStreamsChange: ReturnType<UseTextChangeFn>,
};

type ContextType = UseStorage;

export default createContext<ContextType>({
  storage: {
    ...DEFAULT_STORAGE,
  },
} as UseStorage);

export function useStorage(): UseStorage {
  const [storage, setStorageState] = useState(DEFAULT_STORAGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getStorage(Object.keys(DEFAULT_STORAGE) as StorageKeys) as Storage;
      // Need to merge for the case of new default values
      setStorageState(merge({}, DEFAULT_STORAGE, res));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const keys = Object.keys(DEFAULT_STORAGE) as StorageKeys;
      hookStorage(keys.map(key => ({
        key,
        cb: value => {
          setStorageState(old => ({
            ...old,
            [key]: value,
          }));
        },
      })));
    })();
  }, []);

  const setStorage: SetStorage = useCallback(async (newStorage, optimisticUpdate = false) => {
    if (optimisticUpdate) {
      setStorageState(old => ({
        ...old,
        ...newStorage,
      }));
    }
    await setStorageUtil(newStorage);
  }, []);

  const handleShowPreviewOnHoverEnabledToggle = useToggleFn('showPreviewOnHover', setStorage);
  const handleExtensionEnabledToggle = useToggleFn('enabled', setStorage);
  const handleOpenTabsInBackgroundToggle = useToggleFn('openTabsInBackground', setStorage);
  const handleAutoOpenTabsToggle = useToggleFn('autoOpenTabs', setStorage);
  const handleAutoMuteTabsToggle = useToggleFn('autoMuteTabs', setStorage);
  const handleNotificationsToggle = useToggleFn('notifications', setStorage);
  const handlePollDelayChange = useTextChangeFn('pollDelay', setStorage);
  const handleMaxStreamsChange = useTextChangeFn('maxStreams', setStorage);

  return {
    loading,
    storage,
    setStorage,
    handleShowPreviewOnHoverEnabledToggle,
    handleExtensionEnabledToggle,
    handleOpenTabsInBackgroundToggle,
    handleAutoOpenTabsToggle,
    handleAutoMuteTabsToggle,
    handleNotificationsToggle,
    handlePollDelayChange,
    handleMaxStreamsChange,
  };
}
