// Relative imports since the content scripts may use this too
import { hookStorage, getStorage } from './chrome-utils';
import { DEFAULT_STORAGE } from './app-constants';
import type { MutableStorage, StorageKeys } from './types';

const storage: MutableStorage = { ...(DEFAULT_STORAGE as MutableStorage) };
const storageLoaded = getStorage(Object.keys(DEFAULT_STORAGE) as StorageKeys, storage);
hookStorage(Object.keys(DEFAULT_STORAGE) as StorageKeys, storage);

/**
 * Gets preferences immediately.
 * Initializes them to default and then updates the returned object when we are done fetching the initial
 * or the preferences have changed (hook).
 */
export function getFullStorage(): MutableStorage {
  return storage;
}

/**
 * Gets preferences after they've been fetched initially.
 * Still updates the returned object after the preferences have changed (hook).
 */
export async function waitFullStorage(): Promise<MutableStorage> {
  await storageLoaded;
  return storage;
}
