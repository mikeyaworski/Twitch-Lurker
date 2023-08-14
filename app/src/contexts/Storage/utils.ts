import { useCallback } from 'react';
import type { StorageSyncKey, MutableStorageSync } from 'types';

export type SetStorage = (newStorage: Partial<MutableStorageSync>, optimisticUpdate?: boolean) => void;
export type UseToggleFn = (prefKey: StorageSyncKey, setStorage: SetStorage) => (
  (e: React.ChangeEvent<HTMLInputElement>) => void
);
export type UseTextChangeFn = (prefKey: StorageSyncKey, setStorage: SetStorage) => (
  (e: React.ChangeEvent<HTMLInputElement>) => void
);
export type UseSetPrefFn = (prefKey: StorageSyncKey, setStorage: SetStorage) => (
  (newValue: string) => void
);

export const useToggleFn: UseToggleFn = (prefKey, setStorage) => {
  return useCallback(e => {
    setStorage({ [prefKey]: e.target.checked });
  }, [prefKey, setStorage]);
};

export const useTextChangeFn: UseTextChangeFn = (prefKey, setStorage) => {
  return useCallback(e => {
    setStorage({ [prefKey]: e.target.value });
  }, [prefKey, setStorage]);
};

export const useSetPrefFn: UseSetPrefFn = (prefKey, setStorage) => {
  return useCallback(value => {
    setStorage({ [prefKey]: value });
  }, [prefKey, setStorage]);
};
