import { TITLE } from 'app-constants';

/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
export function log(...args: any[]) {
  console.log(`${TITLE}:`, ...args);
}

export function error(...args: any[]): void {
  console.error(`${TITLE}:`, ...args);
}
