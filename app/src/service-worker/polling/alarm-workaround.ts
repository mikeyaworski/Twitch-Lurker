import { error } from 'src/logging';

/**
 * @see https://issues.chromium.org/issues/40834197#comment114
 */
const storageArea = chrome.storage.local as chrome.storage.LocalStorageArea & {
  onChanged: chrome.storage.StorageChangedEvent
};

const TEST_INTERVAL_MS = 10_000;
const STORAGE_WAIT_TIME_MS = 1_000;

/**
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=1316588
 * @see https://issues.chromium.org/issues/406540677#comment14
 */
const hasChromiumIssue1316588: () => Promise<boolean> = () => new Promise(resolve => {
  let dispatched = false;
  const testEventDispatching = () => {
    storageArea.onChanged.removeListener(testEventDispatching);
    dispatched = true;
  };
  storageArea.onChanged.addListener(testEventDispatching);
  storageArea.set({ testEventDispatching: Math.random() });
  setTimeout(() => resolve(!dispatched), STORAGE_WAIT_TIME_MS);
});

const fixChromiumIssue1316588 = (): void => {
  hasChromiumIssue1316588().then(async hasIssue => {
    if (hasIssue) {
      await error('Detected Chromium issue 1316588; reloading extension to avoid it.');
      chrome.runtime.reload();
    } else {
      setTimeout(fixChromiumIssue1316588, TEST_INTERVAL_MS);
    }
  });
};

export default fixChromiumIssue1316588;
