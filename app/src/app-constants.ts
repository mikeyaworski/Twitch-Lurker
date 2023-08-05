import type { DeepMutable, Login } from './types';

export const BADGE_TEXT_COLOR = '#FFFFFF';
export const BADGE_DEFAULT_BACKGROUND_COLOR = '#777777';
export const BADGE_PURPLE_BACKGROUND_COLOR = '#8561c5';
export const THEME_COLOR = '#9147FF';
export const TITLE = 'Twitch Lurker';
export const TWITCH_CLIENT_ID = 'xms2vxkmtn3rsrv1id2glcnu74fevs';
export const GOOGLE_CLIENT_ID = '1098259349368-ds1kaq3f76gpl80lk9juu8tfnhfpqgon.apps.googleusercontent.com';
export const OAUTH_AUTHORIZATION_CODE_SERVER_API_BASE = 'https://oauth-authorization-code-server.vercel.app/api';
export const YOUTUBE_API_KEY_DOCUMENTATION = 'https://github.com/mikeyaworski/Twitch-Lurker/wiki/YouTube-API-Key';
export const TWITCH_API_BASE = 'https://api.twitch.tv/helix';
export const GOOGLE_API_BASE = 'https://www.googleapis.com/youtube/v3';
export const TWITCH_PAGINATION_LIMIT = 100;
export const UNMUTE_INTERVAL_LENGTH = 3 * 1000;

const DEFAULT_STORAGE_VALUES = {
  // Preferences
  enabled: true,
  autoOpenTabs: true,
  openTabsInBackground: true,
  notifications: false,
  pollDelay: '5', // in minutes
  maxStreams: '2',
  favorites: [] as string[],
  hiddenChannels: {
    twitch: [] as string[],
    youtube: [] as string[],
  },
  addedChannels: {
    twitch: [] as string[],
    youtube: [] as string[],
  },
  autoMuteTabs: true,
  sortLow: true,
  showPreviewOnHover: true,

  // Auth credentials
  logins: [] as Login[],
};

export const DEFAULT_STORAGE = Object.freeze(DEFAULT_STORAGE_VALUES);

export enum MessageType {
  LOGIN_TWITCH,
  LOGIN_YOUTUBE,
  LOGOUT_TWITCH,
  LOGOUT_YOUTUBE,
  FETCH_CHANNELS,
  SEND_CHANNELS,
  MUTE_PLAYER,
}

export type Storage = typeof DEFAULT_STORAGE;
export type MutableStorage = DeepMutable<Storage>;
export type StorageKey = keyof Storage;
export type StorageKeys = StorageKey[];
