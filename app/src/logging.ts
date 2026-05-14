/* eslint-disable no-console */
import { TITLE, LOGGING_TAIL_SIZE } from 'src/app-constants';
import { getStorage, setStorage } from 'src/chrome-utils';
import { stringify } from 'src/utils';
import { IntentionalAny, StorageType } from './types';

async function getLogsFromStorage(): Promise<string[]> {
  const { logs } = await getStorage(['logs'], undefined, StorageType.LOCAL);
  return logs || [];
}

let savingLogPromise: Promise<void> = Promise.resolve();

async function pushLog(message: string): Promise<void> {
  // Pushes to the log storage must be atomic
  savingLogPromise = savingLogPromise.then(async () => {
    try {
      const logs = await getLogsFromStorage();
      logs.push(message);
      if (logs.length > LOGGING_TAIL_SIZE) {
        logs.splice(0, logs.length - LOGGING_TAIL_SIZE);
      }
      await setStorage({ logs }, StorageType.LOCAL);
    } catch (err) {
      // do nothing since the error is logged by getStorage/setStorage
    }
  });
  await savingLogPromise;
}

function getLogMessage(...args: IntentionalAny[]): {
  consoleMessage: string,
  logStorageMessage: string,
} {
  const message = args.map(arg => (typeof arg === 'object' ? stringify(arg) : arg)).join(' ');
  const dateStr = new Date().toISOString();
  return {
    consoleMessage: `${TITLE} [${dateStr}]: ${message}`,
    logStorageMessage: `${message} [${dateStr}]`,
  };
}

export async function log(...args: IntentionalAny[]): Promise<void> {
  const { consoleMessage, logStorageMessage } = getLogMessage(...args);
  console.log(consoleMessage);
  await pushLog(logStorageMessage);
}

export async function error(...args: IntentionalAny[]): Promise<void> {
  const { consoleMessage, logStorageMessage } = getLogMessage(...args);
  console.error(consoleMessage);
  await pushLog(logStorageMessage);
}

export function debug(...args: IntentionalAny[]): void {
  const { consoleMessage } = getLogMessage(...args);
  console.debug(consoleMessage);
}

export async function getLogs(): Promise<string[]> {
  return [...(await getLogsFromStorage())];
}

export function clearLogs(): Promise<void> {
  return setStorage({ logs: [] }, StorageType.LOCAL);
}
/* eslint-enable no-console */
