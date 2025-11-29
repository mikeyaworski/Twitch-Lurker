import browser from 'webextension-polyfill';
import merge from 'lodash.merge';
import { error } from './logging';
import { DEFAULT_STORAGE_LOCAL, DEFAULT_STORAGE_SYNC } from './app-constants';
import {
  StorageSyncKey,
  StorageLocalKey,
  MutableStorageSync,
  MutableStorageLocal,
  StorageSync,
  StorageLocal,
  StorageType,
} from './types';

type StorageSyncKeys<T extends StorageSyncKey | StorageLocalKey = StorageSyncKey> = (T | {
  key: T;
  cb: (value: StorageSync[StorageSyncKey] | StorageLocal[StorageLocalKey]) => void;
})[];

/**
 * Adds a listener to changed storage. `storage`
 * will be updated or the associated callback function (`cb`)
 * will be called whenever a change occurs to storage.
 * The storage change when a user interacts with the extension's popup.
 *
 * @param {Array<string | Object>} storageKeys Array of storage "keys" which are hooked. If the element is a string, it is a storage key.
 *   If the element is an object, it has a `key` field (string) and a `cb` field (function).
 *   `cb` will be called with the new storage and `storage` will not be set for this element (that is up to the caller).
 * @param {Object} storage Object of storage
 */
export function hookStorage(
  storageKeys: StorageSyncKeys<StorageSyncKey> | StorageSyncKeys<StorageLocalKey>,
  storage?: MutableStorageSync | MutableStorageLocal,
): void {
  chrome.storage.onChanged.addListener(res => {
    if (chrome.runtime.lastError) {
      error(JSON.stringify(chrome.runtime.lastError));
      return;
    }
    storageKeys.forEach(storageKey => {
      // it's either a string or an object of the form { key, cb }
      if (typeof storageKey === 'string') {
        // https://github.com/microsoft/TypeScript/issues/31663
        // @ts-ignore
        if (res[storageKey] !== undefined && storage) (storage[storageKey] as unknown) = res[storageKey].newValue;
      } else {
        const { key, cb } = storageKey;
        if (res[key] !== undefined) cb(res[key].newValue);
      }
    });
  });
}

/**
 * Similar to hookStorages, except the storage are retrieved immediately and only once.
 * Also returns a Promise for convenience.
 *
 * @param {Array<string | Object>} storageKeys
 * @param {Object?} storage
 * @param {StorageType?} type Whether the storage should use the synced (default) storage, or local storage for larger data
 *
 * @returns Promise<Object> - Promise which resolves to an object with the storage structure
 */
export async function getStorage(
  storageKeys: StorageSyncKeys<StorageSyncKey>,
  storage: MutableStorageSync | undefined,
  type: StorageType.SYNCED,
): Promise<Partial<MutableStorageSync>>
export async function getStorage(
  storageKeys: StorageSyncKeys<StorageLocalKey>,
  storage: MutableStorageLocal | undefined,
  type: StorageType.LOCAL,
): Promise<Partial<MutableStorageLocal>>
export async function getStorage(
  storageKeys: StorageSyncKeys<StorageSyncKey>,
  storage?: MutableStorageSync,
): Promise<Partial<MutableStorageSync>>
export async function getStorage(
  storageKeys: StorageSyncKeys<StorageSyncKey>,
): Promise<Partial<MutableStorageSync>>
export async function getStorage(
  storageKeys: StorageSyncKeys<StorageSyncKey> | StorageSyncKeys<StorageLocalKey>,
  storage?: MutableStorageSync | MutableStorageLocal,
  type: StorageType = StorageType.SYNCED,
): Promise<Partial<MutableStorageSync> | Partial<MutableStorageLocal>> {
  const isLocal = type === StorageType.LOCAL;
  const getter = isLocal ? browser.storage.local : browser.storage.sync;
  const res = await getter.get(storageKeys.map(key => (typeof key === 'string' ? key : key.key)));
  if (chrome.runtime.lastError) {
    error(JSON.stringify(chrome.runtime.lastError));
    throw chrome.runtime.lastError;
  }

  // TODO: Reduce code duplication and maintain type safety
  if (type === StorageType.LOCAL) {
    const defaultSelectedStorage = (storageKeys as StorageSyncKeys<StorageLocalKey>).reduce((acc, storageKey) => {
      // it's either a string or an object of the form { key, cb }
      const key = typeof storageKey === 'string' ? storageKey : storageKey.key;
      return { ...acc, [key]: DEFAULT_STORAGE_LOCAL[key] };
    }, {} as Partial<MutableStorageLocal>);
    const rawStorage = (storageKeys as StorageSyncKeys<StorageLocalKey>).reduce((acc, storageKey) => {
      // it's either a string or an object of the form { key, cb }
      const key = typeof storageKey === 'string' ? storageKey : storageKey.key;
      const value = res[key] === undefined ? DEFAULT_STORAGE_LOCAL[key] : res[key];
      if (storage) ((storage as MutableStorageLocal)[key] as unknown) = value;
      if (typeof storageKey !== 'string') storageKey.cb(value);
      return { ...acc, [key]: value };
    }, {} as Partial<MutableStorageLocal>);
    // Merge default storage so that this returns default data for any deeply nested new preferences (e.g. storage.hiddenChannels.youtube)
    return merge({}, defaultSelectedStorage, rawStorage);
  }
  const defaultSelectedStorage = (storageKeys as StorageSyncKeys<StorageSyncKey>).reduce((acc, storageKey) => {
    // it's either a string or an object of the form { key, cb }
    const key = typeof storageKey === 'string' ? storageKey : storageKey.key;
    return { ...acc, [key]: DEFAULT_STORAGE_SYNC[key] };
  }, {} as Partial<MutableStorageSync>);
  const rawStorage = (storageKeys as StorageSyncKeys<StorageSyncKey>).reduce((acc, storageKey) => {
    // it's either a string or an object of the form { key, cb }
    const key = typeof storageKey === 'string' ? storageKey : storageKey.key;
    const value = res[key] === undefined ? DEFAULT_STORAGE_SYNC[key] : res[key];
    if (storage) ((storage as MutableStorageSync)[key] as unknown) = value;
    if (typeof storageKey !== 'string') storageKey.cb(value);
    return { ...acc, [key]: value };
  }, {});
  // Merge default storage so that this returns default data for any deeply nested new preferences (e.g. storage.hiddenChannels.youtube)
  return merge({}, defaultSelectedStorage, rawStorage);
}

/**
 * Sets a local storage or set of storage.
 * @param {string | Object} keyOrMap Either a string (representing a key, in which case val must be provided)
 *   or an object with key-value-pair mappings for storing.
 * @param {any?} val The value associated with key, iff key is a string.
 * @param {StorageType?} type Whether the storage should use the synced (default) storage, or local storage for larger data
 */
export async function setStorage(
  data: Partial<StorageSync>,
  type: StorageType.SYNCED,
): Promise<void>
export async function setStorage(
  data: Partial<StorageLocal>,
  type: StorageType.LOCAL,
): Promise<void>
export async function setStorage(
  data: Partial<StorageSync>,
): Promise<void>
export async function setStorage(
  data: Partial<StorageSync> | Partial<StorageLocal>,
  type: StorageType = StorageType.SYNCED,
): Promise<void> {
  const setter = type === StorageType.LOCAL ? browser.storage.local : browser.storage.sync;
  await setter.set(data).catch(err => {
    // TODO: Here, if there is the error QUOTA_BYTES_PER_ITEM, consider storing the data in local storage instead
    // https://developer.chrome.com/docs/extensions/reference/api/storage#properties_3
    // Error: QUOTA_BYTES_PER_ITEM quota exceeded
    error(err);
    throw err;
  });
  if (chrome.runtime.lastError) {
    error(JSON.stringify(chrome.runtime.lastError));
    throw chrome.runtime.lastError;
  }
}
