// Relative imports since the content scripts may use this too
import { hookStorage, getStorage } from './chrome-utils';
import { DEFAULT_STORAGE_SYNC, DEFAULT_STORAGE_LOCAL } from './app-constants';
import { StorageLocalKeys, StorageSyncKeys, StorageType } from './types';

const storageSync = { ...DEFAULT_STORAGE_SYNC };
const storageLocal = { ...DEFAULT_STORAGE_LOCAL };
const storageSyncLoaded = getStorage(Object.keys(DEFAULT_STORAGE_SYNC) as StorageSyncKeys, storageSync);
const storageLocalLoaded = getStorage(Object.keys(DEFAULT_STORAGE_LOCAL) as StorageLocalKeys, storageLocal, StorageType.LOCAL);
hookStorage(Object.keys(DEFAULT_STORAGE_SYNC) as StorageSyncKeys, storageSync);
hookStorage(Object.keys(DEFAULT_STORAGE_LOCAL) as StorageLocalKeys, storageLocal);

/**
 * Gets storage immediately.
 * Initializes them to default and then updates the returned object when we are done fetching the initial
 * or the storage have changed (hook).
 */
export function getFullStorage(type: StorageType.SYNCED): typeof storageSync
export function getFullStorage(type: StorageType.LOCAL): typeof storageLocal
export function getFullStorage(type?: undefined): typeof storageSync
export function getFullStorage(type: StorageType = StorageType.SYNCED) {
  return type == null || type === StorageType.SYNCED ? storageSync : storageLocal;
}

/**
 * Gets storage after they've been fetched initially.
 * Still updates the returned object after the storage have changed (hook).
 */
export function waitFullStorage(type: StorageType.SYNCED): Promise<typeof storageSync>
export function waitFullStorage(type: StorageType.LOCAL): Promise<typeof storageLocal>
export function waitFullStorage(type?: undefined): Promise<typeof storageSync>
export async function waitFullStorage(type: StorageType = StorageType.SYNCED) {
  if (type === StorageType.LOCAL) {
    await storageLocalLoaded;
    return storageLocal;
  }
  await storageSyncLoaded;
  return storageSync;
}
