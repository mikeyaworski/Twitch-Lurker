import type { ChannelType, DeepMutable, Login, YouTubeSubscription, Channel } from './types';

export const POLL_ALARM_NAME = 'POLL';
export const BADGE_TEXT_COLOR = '#FFFFFF';
export const BADGE_DEFAULT_BACKGROUND_COLOR = '#777777';
export const BADGE_PURPLE_BACKGROUND_COLOR = '#8561c5';
export const THEME_COLOR = '#9147FF';
export const TITLE = 'Twitch Lurker';
export const TWITCH_CLIENT_ID = 'xms2vxkmtn3rsrv1id2glcnu74fevs';
export const GOOGLE_CLIENT_ID = '1098259349368-ds1kaq3f76gpl80lk9juu8tfnhfpqgon.apps.googleusercontent.com';
export const OAUTH_AUTHORIZATION_CODE_SERVER_API_BASE = 'https://oauth-authorization-code-server.vercel.app/api';
export const YOUTUBE_API_KEY_DOCUMENTATION = 'https://github.com/mikeyaworski/Twitch-Lurker/wiki/YouTube-API-Key';
export const YOUTUBE_OAUTH_CREDENTIALS_DOCUMENTATION = 'https://github.com/mikeyaworski/Twitch-Lurker/wiki/YouTube-OAuth-2.0';
export const TWITCH_API_BASE = 'https://api.twitch.tv/helix';
export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
export const KICK_API_BASE = 'https://kick.com/api/v2';
export const GOOGLE_OAUTH_API_BASE = 'https://oauth2.googleapis.com/token';
export const TWITCH_PAGINATION_LIMIT = 100;
export const YOUTUBE_PAGINATION_LIMIT = 50;
export const UNMUTE_INTERVAL_LENGTH = 3 * 1000; // 3 seconds
export const REFRESH_TOKEN_EXPIRY_THRESHOLD_SECONDS = 10 * 60; // 10 minutes
export const YOUTUBE_SUBSCRIPTIONS_POLL_DELAY_SECONDS = 60 * 60 * 48; // 2 days
export const LOGGING_TAIL_SIZE = 50;

export enum OriginType {
  TWITCH = 'TWITCH',
  YOUTUBE = 'YOUTUBE',
  KICK = 'KICK',
}
export const ORIGINS = Object.freeze({
  [OriginType.TWITCH]: ['https://*.twitch.tv/*'],
  [OriginType.YOUTUBE]: ['https://*.youtube.com/*', 'https://*.googleapis.com/*'],
  [OriginType.KICK]: ['https://*.kick.com/*'],
});

export interface Favorite {
  type: ChannelType,
  value: string,
}

export const PREFERENCE_STORAGE_VALUES = {
  enabled: true,
  autoOpenTabs: true,
  openTabsInBackground: true,
  notifications: false,
  pollDelay: '5', // in minutes
  maxStreams: '2',
  // string[] is for backwards compatibility
  favorites: [] as string[] | Favorite[],
  hiddenChannels: {
    twitch: [] as string[],
    youtube: [] as string[],
    kick: [] as string[],
  },
  addedChannels: {
    twitch: [] as string[],
    youtube: [] as string[],
    kick: [] as string[],
  },
  autoMuteTabs: true,
  sortLow: true,
  showPreviewOnHover: true,
};

const DEFAULT_STORAGE_SYNC_VALUES = {
  // Preferences
  ...PREFERENCE_STORAGE_VALUES,

  // Auth credentials
  logins: [] as Login[],
};

export const DEFAULT_STORAGE_SYNC = Object.freeze(DEFAULT_STORAGE_SYNC_VALUES);

// Local storage is used for larger data, since there are stricter size requirements on synced storage
const DEFAULT_STORAGE_LOCAL_VALUES = {
  // Recent logs
  logs: [] as string[],
  // Cache
  youtubeSubscriptions: null as null | {
    fetchTime: number | null, // epoch in seconds
    subscriptions: YouTubeSubscription[],
  },
  mostRecentChannels: null as null | {
    fetchTime: number | null, // epoch in seconds
    channels: Channel[],
  },
};

export const DEFAULT_STORAGE_LOCAL = Object.freeze(DEFAULT_STORAGE_LOCAL_VALUES);

export enum MessageType {
  LOGIN_TWITCH,
  LOGIN_YOUTUBE,
  LOGIN_KICK,
  LOGOUT,
  GET_CHANNELS,
  FORCE_FETCH_CHANNELS,
  SEND_CHANNELS,
  MUTE_PLAYER,
  FETCH_YOUTUBE_SUBSCRIPTIONS,
}

export type Preferences = typeof PREFERENCE_STORAGE_VALUES;
export type StorageSync = typeof DEFAULT_STORAGE_SYNC;
export type StorageLocal = typeof DEFAULT_STORAGE_LOCAL;
export type AnyStorage = StorageSync | StorageLocal;
export type MutableStorageSync = DeepMutable<StorageSync>;
export type MutableStorageLocal = DeepMutable<StorageLocal>;
export type StorageSyncKey = keyof StorageSync;
export type PreferencesKey = keyof Preferences;
export type StorageLocalKey = keyof StorageLocal;
export type StorageSyncKeys = StorageSyncKey[];
export type StorageLocalKeys = StorageLocalKey[];
