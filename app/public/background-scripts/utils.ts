import { IntentionalAny } from 'types';

const TWITCH_HOSTNAME_REGEX = /^(www.|m.)?twitch.tv$/;
const TWITCH_CHANNEL_PATH_REGEX = /^\/(?!(videos\/\d+|settings|subscriptions|wallet|inventory|drops|directory))/;

/**
 * Defined here so it can be tested without importing webextension-polyfill-ts.
*/
export function getTwitchUsernameFromUrl(url: string) {
  const matches = url.match(/(twitch\.tv\/)([^/]+)($|\/)/);
  return matches?.[2].toLowerCase() || null;
}

export function getRandomString() {
  return Math.random().toString(36).substring(2, 15);
}

export function parseIdToken(idToken: string, nonce: string): Record<string, IntentionalAny> {
  const userInfoBase64 = idToken?.split('.')[1];
  if (!userInfoBase64) throw new Error();
  const userInfo = JSON.parse(atob(userInfoBase64));
  if (nonce !== userInfo.nonce) throw new Error('Invalid nonce parameter during authorization');
  return userInfo;
}

export function isUrlTwitchChannel(url: string): boolean {
  const { hostname, pathname } = new URL(url);
  return TWITCH_HOSTNAME_REGEX.test(hostname)
    && TWITCH_CHANNEL_PATH_REGEX.test(pathname);
}
