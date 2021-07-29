import {
  getTwitchUsernameFromUrl,
} from '../utils';

describe('src/getTwitchUsernameFromUrl', () => {
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
