import browser from 'webextension-polyfill';
import { getFullStorage } from 'src/storage';
import { ChannelType, Channel, LiveChannel, Login, AccountType, YouTubeLogin, StorageSync, Favorite, OriginType } from 'src/types';
import { ORIGINS } from 'src/app-constants';

const storage = getFullStorage();

export function getSortableValue(channel: Channel): string {
  switch (channel.type) {
    case ChannelType.TWITCH: {
      return channel.username.toLowerCase();
    }
    case ChannelType.KICK:
    case ChannelType.YOUTUBE: {
      return channel.displayName.toLowerCase();
    }
    default: {
      // This should never happen
      return '';
    }
  }
}

export function getAddedChannelsKey(channel: Channel): string {
  switch (channel.type) {
    case ChannelType.KICK:
    case ChannelType.TWITCH: {
      return channel.username;
    }
    case ChannelType.YOUTUBE: {
      return channel.manualInputQuery;
    }
    default: {
      // This should never happen
      return '';
    }
  }
}

export function shouldConvertKeyToLowerCase(platformKey: 'twitch' | 'youtube' | 'kick'): boolean {
  switch (platformKey) {
    case 'twitch':
    case 'kick': {
      return true;
    }
    default: {
      return false;
    }
  }
}

export const getHiddenChannelsKey = getAddedChannelsKey;

export function getFavoriteValue(channel: Channel): string {
  switch (channel.type) {
    case ChannelType.KICK:
    case ChannelType.TWITCH: {
      return channel.username;
    }
    case ChannelType.YOUTUBE: {
      return channel.id;
    }
    default: {
      // This should never happen
      return '';
    }
  }
}

export function getFavoriteKey(channel: Channel): string {
  return channel.type + getFavoriteValue(channel);
}

/**
 * There can be multiple YouTube channel entries for the same channel if that channel has multiple simultaneous livestreams happening.
 * This function is useful to get a unique ID based on each channel and each ID.
 */
export function getId(channel: Channel): string {
  switch (channel.type) {
    case ChannelType.KICK:
    case ChannelType.TWITCH: {
      // Twitch and Kick cannot have multiple entries
      return `${channel.type}-${channel.username}`;
    }
    case ChannelType.YOUTUBE: {
      const baseId = channel.type + channel.id + channel.manualInputQuery;
      if (channel.videoId) return baseId + channel.videoId;
      return baseId;
    }
    default: {
      // This should never happen
      return '';
    }
  }
}

export function getFormattedFavorites(favorites: string[] | Favorite[]): Favorite[] {
  return favorites.map((favorite: string | Favorite): Favorite => {
    if (typeof favorite === 'string') return { type: ChannelType.TWITCH, value: favorite };
    return favorite;
  });
}

export function getFavoritesIncludesChannel(favorites: string[] | Favorite[], channel: Channel): boolean {
  return getFormattedFavorites(favorites).map(f => f.type + f.value).includes(getFavoriteKey(channel));
}

export function sortByName(a: Channel, b: Channel) {
  return getSortableValue(a) < getSortableValue(b) ? -1 : 1;
}

function sortByViewerCounts(a: LiveChannel, b: LiveChannel, sortLow: boolean) {
  return sortLow ? a.viewerCount - b.viewerCount : b.viewerCount - a.viewerCount;
}

function sortByFavorites(a: Channel, b: Channel, favs: Favorite[]) {
  const favIds = favs.map(f => f.type + f.value);
  const aFav = favIds.indexOf(getFavoriteKey(a));
  const bFav = favIds.indexOf(getFavoriteKey(b));

  if (aFav === -1 && bFav >= 0) return 1;
  if (bFav === -1 && aFav >= 0) return -1;
  if (aFav !== -1 && bFav !== -1) return aFav - bFav;

  return null;
}

/**
 * Returns negative number if a has higher precedence than b, else positive.
 */
export function sortChannels(a: Channel, b: Channel, favs: string[] | Favorite[], sortLow = true) {
  favs = getFormattedFavorites(favs);
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

export function getChannelUrl(channel: Channel): string {
  switch (channel.type) {
    case ChannelType.TWITCH: {
      return `https://www.twitch.tv/${channel.username}`;
    }
    case ChannelType.YOUTUBE: {
      return channel.viewerCount != null
        ? `https://www.youtube.com/watch?v=${channel.videoId}`
        : `https://www.youtube.com/channel/${channel.id}`;
    }
    case ChannelType.KICK: {
      return `https://kick.com/${channel.username}`;
    }
    default: {
      return '';
    }
  }
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const accountsThatCanFetchChannels: AccountType[] = [AccountType.TWITCH, AccountType.YOUTUBE_API_KEY, AccountType.YOUTUBE, AccountType.KICK];

export function getIsLoggedInWithAnyAccount(logins: Login[]): boolean {
  return logins.some(login => accountsThatCanFetchChannels.includes(login.type));
}

export function getIsLoggedInWithMultipleAccounts(logins: Login[]): boolean {
  return logins.filter(login => accountsThatCanFetchChannels.includes(login.type)).length > 1;
}

export function getYouTubeLogin(storage: StorageSync): YouTubeLogin | undefined {
  return storage.logins.find((login): login is YouTubeLogin => login.type === AccountType.YOUTUBE);
}

function getHostPermissionRequests(): browser.Permissions.Permissions {
  const permissions: browser.Permissions.Permissions = {
    origins: [],
  };
  const hasTwitchAccount = storage.logins.some(login => login.type === AccountType.TWITCH);
  const hasYouTubeAccount = storage.logins.some(login => login.type === AccountType.YOUTUBE_API_KEY
    || login.type === AccountType.YOUTUBE);
  if (hasTwitchAccount) permissions.origins?.push(...ORIGINS[OriginType.TWITCH]);
  if (hasYouTubeAccount) permissions.origins?.push(...ORIGINS[OriginType.YOUTUBE]);
  return permissions;
}

export function requestNecessaryHostPermissions(): Promise<boolean> | boolean {
  return browser.permissions.request(getHostPermissionRequests());
}

/**
 * Helps to stringify Error objects as well.
 * https://stackoverflow.com/a/53624454/2554605
 */
export function stringify(obj: unknown): string {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Error) {
      return {
        // pull all enumerable properties
        ...value,
        // explicitly pull Error's non-enumerable properties
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }
    return value;
  });
}
