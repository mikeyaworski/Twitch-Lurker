import { log, error } from 'src/logging';
import { getStorage, setStorage } from 'src/chrome-utils';
import { StorageType } from 'src/types';

/**
 * @see https://issues.chromium.org/issues/40834197#comment114
 */
const storageArea = chrome.storage.local as chrome.storage.LocalStorageArea & {
  onChanged: chrome.storage.StorageChangedEvent
};

const TEST_INTERVAL_MS = 10_000;
const STORAGE_WAIT_TIME_MS = 5_000;
const RELOAD_COOLDOWN_SECONDS = 60;

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
      const currentTime = Math.floor(Date.now() / 1000);
      const { lastReloadTime } = await getStorage(['lastReloadTime'], undefined, StorageType.LOCAL);
      if (lastReloadTime && (currentTime - lastReloadTime) < RELOAD_COOLDOWN_SECONDS) {
        log(`Extension was reloaded less than ${RELOAD_COOLDOWN_SECONDS} seconds ago; skipping reload.`);
        setTimeout(fixChromiumIssue1316588, TEST_INTERVAL_MS);
      } else {
        await setStorage({ lastReloadTime: currentTime }, StorageType.LOCAL);
        chrome.runtime.reload();
      }
    } else {
      setTimeout(fixChromiumIssue1316588, TEST_INTERVAL_MS);
    }
  });
};

export default function alarmsWorkaround() {
  log('Testing for alarms bug with Chromium issue');
  fixChromiumIssue1316588();
}
