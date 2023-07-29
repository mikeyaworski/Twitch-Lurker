import { IntentionalAny } from 'types';

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
