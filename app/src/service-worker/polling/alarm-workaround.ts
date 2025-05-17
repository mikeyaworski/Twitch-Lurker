/**
 * @see https://issues.chromium.org/issues/40834197#comment114
 */
const storageArea = chrome.storage.local as chrome.storage.LocalStorageArea & {
  onChanged: chrome.storage.StorageChangedEvent
};

const TEST_INTERVAL_MS = 10000;
const STORAGE_WAIT_TIME_MS = 100;

/**
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=1316588
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
  hasChromiumIssue1316588().then(hasIssue => {
    if (hasIssue) {
      chrome.runtime.reload();
    } else {
      setTimeout(fixChromiumIssue1316588, TEST_INTERVAL_MS);
    }
  });
};

export default fixChromiumIssue1316588;
