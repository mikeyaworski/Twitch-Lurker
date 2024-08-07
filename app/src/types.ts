// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IntentionalAny = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFn = (...props: any) => any;
export type VoidFn = () => void;
export type UnknownFn = (...props: unknown[]) => unknown;

export type GenericMapping<T1, T2 extends string = string> = {
  [key in T2]?: T1;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyMapping<T extends string = string> = GenericMapping<any, T>;
export type UnknownMapping<T extends string = string> = GenericMapping<unknown, T>;

// https://stackoverflow.com/a/43001581/2554605
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
export type DeepMutable<T> = { -readonly [P in keyof T]: DeepMutable<T[P]> };

export type SvgClickEventHandler = React.MouseEventHandler<SVGSVGElement>;

export enum StorageType {
  LOCAL,
  SYNCED,
}

export enum ChannelType {
  TWITCH,
  YOUTUBE,
  KICK,
}

export interface BaseChannel {
  displayName: string,
  profilePic?: string,
  viewerCount?: number,
  start?: string,
}

export interface TwitchChannel extends BaseChannel {
  type: ChannelType.TWITCH,
  username: string,
  thumbnail?: string,
  game?: string,
  title?: string,
}

export interface YouTubeChannel extends BaseChannel {
  type: ChannelType.YOUTUBE,
  id: string,
  manualInputQuery: string, // value which the user entered to add this channel
  uploadsPlaylist?: string,
  customUrl?: string,
  videoId?: string,
  title?: string,
  thumbnail?: string,
}

export interface KickChannel extends BaseChannel {
  type: ChannelType.KICK,
  username: string,
  thumbnail?: string,
  category?: string,
  title?: string,
}

export type Channel = TwitchChannel | YouTubeChannel | KickChannel;

export type LiveTwitchChannel = TwitchChannel & {
  viewerCount: number,
  thumbnail: string,
  title: string,
  game: string,
  start: string,
};

export type LiveYouTubeChannel = YouTubeChannel & {
  viewerCount: number,
  thumbnail: string,
  start: string,
  videoId: string,
  title: string,
};

export type LiveKickChannel = KickChannel & {
  viewerCount: number,
  thumbnail: string,
  start: string,
  title: string,
};

export type LiveChannel = LiveTwitchChannel | LiveYouTubeChannel | LiveKickChannel;

export enum AccountType {
  TWITCH,
  YOUTUBE_OAUTH_CREDENTIALS,
  YOUTUBE,
  YOUTUBE_API_KEY,
  KICK,
}

export interface TwitchLogin {
  type: typeof AccountType.TWITCH,
  accessToken: string,
  userId: string,
  username?: string,
}

// This is an intermediate step before logging in with YouTube
export interface YouTubeOAuthCredentials {
  type: typeof AccountType.YOUTUBE_OAUTH_CREDENTIALS,
  clientId: string,
  clientSecret: string,
}

export interface YouTubeLogin {
  type: typeof AccountType.YOUTUBE,
  clientId?: string,
  clientSecret?: string,
  accessToken: string,
  refreshToken: string,
  expiry: number, // epoch in seconds
  userId: string,
  email: string,
  name: string,
}

export interface YouTubeApiKey {
  type: typeof AccountType.YOUTUBE_API_KEY,
  apiKey: string,
}

export interface KickLogin {
  type: typeof AccountType.KICK,
  // TODO: Once the API is public, add a way to actually log in
  // https://developers.kick.com
}

export type Login = TwitchLogin | YouTubeOAuthCredentials | YouTubeLogin | YouTubeApiKey | KickLogin;

export interface YouTubeSubscription {
  channelId: string,
  displayName: string,
}

// exporting the app-constants types so they can be imported from here as well (convenience)
export * from './app-constants';
