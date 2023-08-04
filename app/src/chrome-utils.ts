import { browser } from 'webextension-polyfill-ts';
import merge from 'lodash.merge';
import { error } from './logging';
import { DEFAULT_STORAGE } from './app-constants';
import type { StorageKey, MutableStorage, UnknownMapping, Storage } from './types';

type StorageKeys = (StorageKey | {
  key: StorageKey;
  cb: (value: Storage[StorageKey]) => void;
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
export function hookStorage(storageKeys: StorageKeys, storage?: MutableStorage): void {
  chrome.storage.onChanged.addListener(res => {
    if (chrome.runtime.lastError) {
      error(JSON.stringify(chrome.runtime.lastError));
      return;
    }
    storageKeys.forEach(storageKey => {
      // it's either a string or an object of the form { key, cb }
      if (typeof storageKey === 'string') {
        // https://github.com/microsoft/TypeScript/issues/31663
        if (res[storageKey] !== undefined && storage) (storage[storageKey] as unknown) = res[storageKey].newValue;
      } else {
        const { key, cb } = storageKey;
        if (res[key] !== undefined) cb(res[key].newValue);
      }
    });
  });
}

type GetStorages = (
  storageKeys: StorageKeys,
  storage?: MutableStorage,
) => Promise<Partial<Storage>>;

/**
 * Similar to hookStorages, except the storage are retrieved immediately and only once.
 * Also returns a Promise for convenience.
 *
 * @param {Array<string | Object>} storageKeys
 * @param {Object?} storage
 *
 * @returns Promise<Array> - Promise which resolves to an array with the order corresponding to the storageKeys order.
 */
export const getStorage: GetStorages = async (storageKeys, storage) => {
  const res = await browser.storage.sync.get(storageKeys.map(key => (typeof key === 'string' ? key : key.key)));
  if (chrome.runtime.lastError) {
    error(JSON.stringify(chrome.runtime.lastError));
    throw chrome.runtime.lastError;
  }
  const defaultSelectedStorage = storageKeys.reduce((acc, storageKey) => {
    // it's either a string or an object of the form { key, cb }
    if (typeof storageKey === 'string') {
      return {
        ...acc,
        [storageKey]: DEFAULT_STORAGE[storageKey],
      };
    }
    return {
      ...acc,
      [storageKey.key]: DEFAULT_STORAGE[storageKey.key],
    };
  }, {} as Partial<Storage>);
  const rawStorage = storageKeys.reduce((acc, storageKey) => {
    // it's either a string or an object of the form { key, cb }
    if (typeof storageKey === 'string') {
      const value = res[storageKey] === undefined ? DEFAULT_STORAGE[storageKey] : res[storageKey];
      if (storage) (storage[storageKey] as unknown) = value;
      return { ...acc, [storageKey]: value };
    }
    const { key, cb } = storageKey;
    const value = res[key] === undefined ? DEFAULT_STORAGE[key] : res[key];
    cb(value);
    return { ...acc, [key]: value };
  }, {});
  // Merge default storage so that this returns default data for any deeply nested new preferences (e.g. storage.hiddenChannels.youtube)
  return merge({}, defaultSelectedStorage, rawStorage);
};

type SetStorage = (
  keyOrMap: string | UnknownMapping,
  val?: unknown,
) => Promise<void>;

/**
 * Sets a local storage or set of storage.
 * @param {string | Object} keyOrMap Either a string (representing a key, in which case val must be provided)
 *   or an object with key-value-pair mappings for storing.
 * @param {any?} val The value associated with key, iff key is a string.
 */
export const setStorage: SetStorage = async (keyOrMap, val) => {
  const options = typeof keyOrMap === 'string'
    ? { [keyOrMap]: val }
    : keyOrMap;
  await browser.storage.sync.set(options);
  if (chrome.runtime.lastError) {
    error(JSON.stringify(chrome.runtime.lastError));
    throw chrome.runtime.lastError;
  }
};
