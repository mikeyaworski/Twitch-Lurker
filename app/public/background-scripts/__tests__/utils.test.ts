import {
  getTwitchUsernameFromUrl,
  isUrlTwitchChannel,
  isLockedTwitchPage,
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
    it('works for the moderator page', () => {
      const username = getTwitchUsernameFromUrl(
        'https://www.twitch.tv/moderator/foobar',
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
    it('works when viewing a piece of VOD content', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/videos/123',
      )).toBe(false);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/foo/clip/bar',
      )).toBe(false);
    });
    it('works for a random URL', () => {
      expect(isUrlTwitchChannel(
        'https://example.com/test',
      )).toBe(false);
    });
    it('works for moderator view of a channel', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/moderator/foobar',
      )).toBe(true);
    });
    it('works for popout chat', () => {
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/popout/foobar/chat?popout=',
      )).toBe(false);
      expect(isUrlTwitchChannel(
        'https://www.twitch.tv/popout/foobar/guest-star',
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
  describe('isLockedTwitchPage', () => {
    it('works with query parameters', () => {
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/foobar/videos?filter=archives&sort=time',
      )).toBe(true);
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/foobar/clips?period=24hr',
      )).toBe(true);
    });
    it('works with a trailing route', () => {
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/foobar/videos',
      )).toBe(true);
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/foobar/clips',
      )).toBe(true);
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/foo/clip/bar',
      )).toBe(true);
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/foobar/about',
      )).toBe(true);
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/foobar/schedule',
      )).toBe(true);
    });
    it('works for moderator view of a channel', () => {
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/moderator/foobar',
      )).toBe(true);
    });
    it('works for a base channel URL', () => {
      expect(isLockedTwitchPage(
        'https://www.twitch.tv/foobar',
      )).toBe(false);
    });
    it('works for a random URL', () => {
      expect(isLockedTwitchPage(
        'https://example.com/test',
      )).toBe(false);
    });
  });
});
