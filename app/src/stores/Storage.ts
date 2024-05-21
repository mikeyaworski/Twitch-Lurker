import { create } from 'zustand';
import { useEffect } from 'react';
import merge from 'lodash.merge';
import { StorageSync, StorageLocal, StorageSyncKeys, StorageLocalKeys, IntentionalAny, StorageType } from 'types';
import type { MutableStorageSync } from 'types';
import { DEFAULT_STORAGE_SYNC, DEFAULT_STORAGE_LOCAL } from 'app-constants';
import { getStorage, hookStorage, setStorage as setStorageUtil } from 'chrome-utils';

type SetStorage = (newStorage: Partial<MutableStorageSync>, optimisticUpdate?: boolean) => void;

interface StorageStore {
  loading: boolean,
  setLoading: (isLoading: boolean) => void,
  storage: StorageSync,
  storageLocal: StorageLocal,
  setStorage: SetStorage,
  setStorageSyncState: (partialStorage: Partial<StorageSync>) => void,
  setStorageLocalState: (partialStorage: Partial<StorageLocal>) => void,
  fetchStorage: () => Promise<void>,
}

export const useStorage = create<StorageStore>()((set, get) => ({
  loading: true,
  setLoading: (loading: boolean) => set({ loading }),
  storage: {
    ...DEFAULT_STORAGE_SYNC,
  },
  storageLocal: {
    ...DEFAULT_STORAGE_LOCAL,
  },
  setStorageSyncState: partialStorage => {
    set(old => ({
      storage: {
        ...old.storage,
        ...partialStorage,
      },
    }));
  },
  setStorageLocalState: partialStorage => {
    set(old => ({
      storageLocal: {
        ...old.storageLocal,
        ...partialStorage,
      },
    }));
  },
  setStorage: async (newStorage, optimisticUpdate = false) => {
    if (optimisticUpdate) {
      get().setStorageSyncState(newStorage);
    }
    await setStorageUtil(newStorage, StorageType.SYNCED);
  },
  fetchStorage: async () => {
    set({ loading: true });
    const [syncedRes, localRes] = await Promise.all([
      getStorage(Object.keys(DEFAULT_STORAGE_SYNC) as StorageSyncKeys),
      getStorage(Object.keys(DEFAULT_STORAGE_LOCAL) as StorageLocalKeys, undefined, StorageType.LOCAL),
    ]);
    // Need to merge for the case of new default values
    set({
      loading: false,
      storage: merge({}, DEFAULT_STORAGE_SYNC, syncedRes),
      storageLocal: merge({}, DEFAULT_STORAGE_LOCAL, localRes),
    });
  },
}));

export function useStorageInitialization() {
  const fetchStorage = useStorage(store => store.fetchStorage);
  const setStorageSyncState = useStorage(store => store.setStorageSyncState);
  const setStorageLocalState = useStorage(store => store.setStorageLocalState);

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  useEffect(() => {
    const syncedKeys = Object.keys(DEFAULT_STORAGE_SYNC) as StorageSyncKeys;
    const localKeys = Object.keys(DEFAULT_STORAGE_LOCAL) as StorageLocalKeys;
    hookStorage(syncedKeys.map(key => ({
      key,
      cb: value => {
        setStorageSyncState({
          [key]: value,
        });
      },
    })));
    hookStorage(localKeys.map(key => ({
      key,
      cb: (value: IntentionalAny) => {
        setStorageLocalState({
          [key]: value,
        });
      },
    })));
  }, [setStorageSyncState, setStorageLocalState]);
}
