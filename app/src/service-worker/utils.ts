import jwtDecode from 'jwt-decode';
import browser from 'webextension-polyfill';
import { ORIGINS } from 'src/app-constants';
import { IntentionalAny, OriginType } from 'src/types';

const TWITCH_HOSTNAME_REGEX = /^(www.|m.)?twitch.tv$/i;
const TWITCH_CHANNEL_PATH_REGEX = /^\/(?!(videos\/\d+|[^/]+\/clip\/.+|settings|popout|subscriptions|wallet|inventory|drops|directory))/i;
const TWITCH_LOCKED_TAB_REGEX = /^\/(moderator\/.+)|([^/]+\/(videos|clips?|schedule|about))/i;

/**
 * Defined here so it can be tested without importing webextension-polyfill-ts.
*/
export function getTwitchUsernameFromUrl(url: string) {
  const matches = url.match(/(twitch\.tv\/)(moderator\/)?([^/]+)($|\/)/);
  return matches?.[3].toLowerCase() || null;
}

export function getRandomString() {
  return Math.random().toString(36).substring(2, 15);
}

export function parseIdToken(idToken: string, nonce: string): Record<string, IntentionalAny> {
  const userInfo: IntentionalAny = jwtDecode(idToken);
  if (nonce !== userInfo.nonce) throw new Error('Invalid nonce parameter during authorization');
  return userInfo;
}

export function isUrlTwitchChannel(url: string): boolean {
  const { hostname, pathname } = new URL(url);
  return TWITCH_HOSTNAME_REGEX.test(hostname)
    && TWITCH_CHANNEL_PATH_REGEX.test(pathname);
}

/**
 * Locked Twitch pages are ones that probably have the video player running, but cannot be replaced with an alternate stream
 * since the user is probably interacting with the page (e.g. viewing VOD material or moderating)
 */
export function isLockedTwitchPage(url: string): boolean {
  const { hostname, pathname } = new URL(url);
  return TWITCH_HOSTNAME_REGEX.test(hostname)
    && TWITCH_LOCKED_TAB_REGEX.test(pathname);
}

export async function getHasTwitchHostPermission(): Promise<boolean> {
  return browser.permissions.contains({
    origins: [ORIGINS[OriginType.TWITCH]],
  });
}
