import type { Channel, LiveChannel } from 'types';

export function sortByName(a: Channel, b: Channel) {
  return a.username.toLowerCase() < b.username.toLowerCase() ? -1 : 1;
}

function sortByViewerCounts(a: LiveChannel, b: LiveChannel, sortLow: boolean) {
  return sortLow ? a.viewerCount - b.viewerCount : b.viewerCount - a.viewerCount;
}

function sortByFavorites(a: Channel, b: Channel, favs: string[]) {
  const aFav = favs.indexOf(a.username);
  const bFav = favs.indexOf(b.username);

  if (aFav === -1 && bFav >= 0) return 1;
  if (bFav === -1 && aFav >= 0) return -1;
  if (aFav !== -1 && bFav !== -1) return aFav - bFav;

  return null;
}

/**
 * Returns negative number if a has higher precedence than b, else positive.
 */
export function sortChannels(a: Channel, b: Channel, favs: string[], sortLow = true) {
  const aLive = a.viewerCount != null;
  const bLive = b.viewerCount != null;

  if (aLive && !bLive) return -1;
  if (bLive && !aLive) return 1;

  // Both channels live
  if (aLive && bLive) {
    const sort = sortByFavorites(a, b, favs);
    return sort != null ? sort : sortByViewerCounts(a as LiveChannel, b as LiveChannel, sortLow);
  }

  // Both channels offline
  const sort = sortByFavorites(a, b, favs);
  return sort != null ? sort : sortByName(a as LiveChannel, b as LiveChannel);
}

const MS_IN_SEC = 1000;
const MS_IN_MIN = MS_IN_SEC * 60;
const MS_IN_HOUR = MS_IN_MIN * 60;

export function getStreamLength(utcTimestamp: string) {
  const date = new Date(utcTimestamp);
  let length = Date.now() - date.getTime();
  const hours = Math.floor(length / MS_IN_HOUR);
  length %= MS_IN_HOUR;
  const mins = Math.floor(length / MS_IN_MIN);
  length %= MS_IN_MIN;
  const secs = Math.floor(length / MS_IN_SEC);
  length %= MS_IN_SEC;
  const hoursStr = hours ? `${hours}:` : '';
  return `${hoursStr}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
