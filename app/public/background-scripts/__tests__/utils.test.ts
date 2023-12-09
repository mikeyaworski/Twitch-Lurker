import {
  getTwitchUsernameFromUrl,
  isUrlTwitchChannel,
} from '../utils';

describe('background-scripts/utils', () => {
  describe('getTwitchUsernameFromUrl', () => {
    it('works for a regular twitch page 1', () => {
      const username = getTwitchUsernameFromUrl(
        'https://twitch.tv/foobar',
      );
      expect(username).toEqual('foobar');
    });
    it('works for a regular twitch page 2', () => {
      const username = getTwitchUsernameFromUrl(
        'https://www.twitch.tv/foobar',
      );
      expect(username).toEqual('foobar');
    });
    it('works with query parameters', () => {
      const username = getTwitchUsernameFromUrl(
        'https://www.twitch.tv/foobar/clips?period=24hr',
      );
      expect(username).toEqual('foobar');
    });
    it('works with a trailing route', () => {
      const username = getTwitchUsernameFromUrl(
        'https://www.twitch.tv/foobar/videos',
      );
      expect(username).toEqual('foobar');
    });
    it('returns null for a random URL', () => {
      const username = getTwitchUsernameFromUrl(
        'https://example.com/test',
      );
      expect(username).toEqual(null);
    });
    it('converts to lower case', () => {
      const username = getTwitchUsernameFromUrl(
        'https://twitch.tv/FooBar',
      );
      expect(username).toEqual('foobar');
    });
  });
  describe('isUrlTwitchChannel', () => {
    it('works for a regular twitch page', () => {
      expect(isUrlTwitchChannel(
        'https://twitch.tv/foobar',
      )).toBe(true);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/foobar',
      )).toBe(true);
    });
    it('works with query parameters', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/foobar/clips?period=24hr',
      )).toBe(true);
    });
    it('works with a trailing route', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/foobar/videos',
      )).toBe(true);
    });
    it('works for a random URL', () => {
      expect(isUrlTwitchChannel(
        'https://example.com/test',
      )).toBe(false);
    });
    it('works for home page', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv',
      )).toBe(true);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/',
      )).toBe(true);
    });
    it('works for settings', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/settings',
      )).toBe(false);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/settings/profile',
      )).toBe(false);
    });
    it('works for subscriptions', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/subscriptions',
      )).toBe(false);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/subscriptions?tab=turbo',
      )).toBe(false);
    });
    it('works for inventory', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/inventory',
      )).toBe(false);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/drops/inventory',
      )).toBe(false);
    });
    it('works for wallet', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/wallet',
      )).toBe(false);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/wallet?tab=purchase-history',
      )).toBe(false);
    });
    it('works for directory', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/directory',
      )).toBe(false);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/directory/category/just-chatting',
      )).toBe(false);
    });
  });
});
