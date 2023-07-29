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
export type AnyMapping = GenericMapping<any>;
export type UnknownMapping = GenericMapping<unknown>;

// https://stackoverflow.com/a/43001581/2554605
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
export type DeepMutable<T> = { -readonly [P in keyof T]: DeepMutable<T[P]> };

export type SvgClickEventHandler = React.MouseEventHandler<SVGSVGElement>;

export type Channel = {
  username: string;
  displayName: string;
  viewerCount?: number;
  profilePic?: string;
  thumbnail?: string;
  game?: string;
  start?: string;
};

export type LiveChannel = Channel & {
  viewerCount: number;
  thumbnail: string;
  game: string;
  start: string;
};

export enum AccountType {
  TWITCH,
  YOUTUBE,
}

export interface TwitchLogin {
  type: typeof AccountType.TWITCH,
  accessToken: string,
  userId: string,
  username?: string,
}

export interface YouTubeLogin {
  type: typeof AccountType.YOUTUBE,
  accessToken: string,
  refreshToken: string,
  expiry: number, // epoch in seconds
  userId: string,
  email: string,
  name: string,
}

export type Login = TwitchLogin | YouTubeLogin;

// exporting the app-constants types so they can be imported from here as well (convenience)
export * from './app-constants';
