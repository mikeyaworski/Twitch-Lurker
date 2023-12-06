import { createContext, useCallback, useEffect, useState } from 'react';
import merge from 'lodash.merge';
import { StorageSync, StorageLocal, StorageSyncKeys, StorageLocalKeys, IntentionalAny, StorageType } from 'types';
import { DEFAULT_STORAGE_SYNC, DEFAULT_STORAGE_LOCAL } from 'app-constants';
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
  storage: StorageSync,
  storageLocal: StorageLocal,
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
    ...DEFAULT_STORAGE_SYNC,
  },
  storageLocal: {
    ...DEFAULT_STORAGE_LOCAL,
  },
} as UseStorage);

export function useStorage(): UseStorage {
  const [storageSync, setStorageSyncState] = useState<StorageSync>(DEFAULT_STORAGE_SYNC);
  const [storageLocal, setStorageLocalState] = useState<StorageLocal>(DEFAULT_STORAGE_LOCAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [syncedRes, localRes] = await Promise.all([
        getStorage(Object.keys(DEFAULT_STORAGE_SYNC) as StorageSyncKeys),
        getStorage(Object.keys(DEFAULT_STORAGE_LOCAL) as StorageLocalKeys, undefined, StorageType.LOCAL),
      ]);
      // Need to merge for the case of new default values
      setStorageSyncState(merge({}, DEFAULT_STORAGE_SYNC, syncedRes));
      setStorageLocalState(merge({}, DEFAULT_STORAGE_LOCAL, localRes));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const syncedKeys = Object.keys(DEFAULT_STORAGE_SYNC) as StorageSyncKeys;
    const localKeys = Object.keys(DEFAULT_STORAGE_LOCAL) as StorageLocalKeys;
    hookStorage(syncedKeys.map(key => ({
      key,
      cb: value => {
        setStorageSyncState(old => ({
          ...old,
          [key]: value,
        }));
      },
    })));
    hookStorage(localKeys.map(key => ({
      key,
      cb: (value: IntentionalAny) => {
        setStorageLocalState(old => ({
          ...old,
          [key]: value,
        }));
      },
    })));
  }, []);

  const setStorageSync: SetStorage = useCallback(async (newStorage, optimisticUpdate = false) => {
    if (optimisticUpdate) {
      setStorageSyncState(old => ({
        ...old,
        ...newStorage,
      }));
    }
    await setStorageUtil(newStorage, StorageType.SYNCED);
  }, []);

  const handleShowPreviewOnHoverEnabledToggle = useToggleFn('showPreviewOnHover', setStorageSync);
  const handleExtensionEnabledToggle = useToggleFn('enabled', setStorageSync);
  const handleOpenTabsInBackgroundToggle = useToggleFn('openTabsInBackground', setStorageSync);
  const handleAutoOpenTabsToggle = useToggleFn('autoOpenTabs', setStorageSync);
  const handleAutoMuteTabsToggle = useToggleFn('autoMuteTabs', setStorageSync);
  const handleNotificationsToggle = useToggleFn('notifications', setStorageSync);
  const handlePollDelayChange = useTextChangeFn('pollDelay', setStorageSync);
  const handleMaxStreamsChange = useTextChangeFn('maxStreams', setStorageSync);

  return {
    loading,
    storage: storageSync,
    setStorage: setStorageSync,
    storageLocal,
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
