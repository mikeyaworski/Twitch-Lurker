/**
 * Defined here so it can be tested without importing webextension-polyfill-ts.
*/
export function getTwitchUsernameFromUrl(url: string) {
  const matches = url.match(/(twitch\.tv\/)([^/]+)($|\/)/);
  return matches?.[2].toLowerCase() || null;
}
