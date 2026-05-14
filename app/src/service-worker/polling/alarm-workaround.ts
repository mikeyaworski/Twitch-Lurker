import { log, error, debug } from 'src/logging';
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
function hasChromiumIssue1316588(): Promise<boolean> {
  return new Promise(resolve => {
    let dispatched = false;
    const testEventDispatching = () => {
      storageArea.onChanged.removeListener(testEventDispatching);
      dispatched = true;
    };
    storageArea.onChanged.addListener(testEventDispatching);
    storageArea.set({ testEventDispatching: Math.random() });
    setTimeout(() => resolve(!dispatched), STORAGE_WAIT_TIME_MS);
  });
}

async function maybeFixChromiumIssue1316588() {
  while (true) {
    const { useAlarmsWorkaround } = await getStorage(['useAlarmsWorkaround']);
    if (useAlarmsWorkaround) {
      debug('Testing for alarms bug with Chromium issue');
      const hasIssue = await hasChromiumIssue1316588();

      if (hasIssue) {
        await error('Detected Chromium issue 1316588; reloading extension to avoid it.');
        const currentTime = Math.floor(Date.now() / 1000);
        const { lastReloadTime } = await getStorage(['lastReloadTime'], undefined, StorageType.LOCAL);

        if (lastReloadTime && (currentTime - lastReloadTime) < RELOAD_COOLDOWN_SECONDS) {
          log(`Extension was reloaded less than ${RELOAD_COOLDOWN_SECONDS} seconds ago; skipping reload.`);
        } else {
          await setStorage({ lastReloadTime: currentTime }, StorageType.LOCAL);
          chrome.runtime.reload();
          return;
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, TEST_INTERVAL_MS));
  }
}

export default async function alarmsWorkaround() {
  const { useAlarmsWorkaround } = await getStorage(['useAlarmsWorkaround']);
  // Duplicate log here (just for the first invocation) so that the user can check if it's working
  // without looking at the verbose logs in the service worker.
  if (useAlarmsWorkaround) {
    log('Testing for alarms bug with Chromium issue');
  }
  maybeFixChromiumIssue1316588();
}
