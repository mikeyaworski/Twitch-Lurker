import browser from 'webextension-polyfill';
import { getStorage, setStorage } from 'src/chrome-utils';
import { TWITCH_CLIENT_ID } from 'src/app-constants';
import { AccountType, Login } from 'src/types';
import { getRandomString, parseIdToken } from '../utils';

async function createAuthEndpoint() {
  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  const redirectUri = await browser.identity.getRedirectURL();
  url.searchParams.append('client_id', TWITCH_CLIENT_ID);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'token id_token');
  url.searchParams.append('scope', 'openid user:read:follows');
  url.searchParams.append('force_verify', 'true');
  url.searchParams.append('state', getRandomString());
  url.searchParams.append('nonce', getRandomString());
  return url.href;
}

export async function login() {
  const authEndpoint = await createAuthEndpoint();
  const state = new URL(authEndpoint).searchParams.get('state');
  const nonce = new URL(authEndpoint).searchParams.get('nonce');
  const redirectUrl = await browser.identity.launchWebAuthFlow({
    url: authEndpoint,
    interactive: true,
  });
  const url = new URL(redirectUrl);
  const params = url.hash ? new URLSearchParams(url.hash.substring(1)) : url.searchParams;
  if (state !== params.get('state')) throw new Error('Invalid state parameter during authorization');
  const accessToken = params.get('access_token');
  const idToken = params.get('id_token');
  if (!idToken || !nonce) throw new Error();
  const userInfo = parseIdToken(idToken, nonce);
  const userId = userInfo.sub;
  const username = userInfo.preferred_username;

  if (accessToken && userId) {
    const { logins = [] } = await getStorage(['logins']);
    const newLogin: Login = {
      type: AccountType.TWITCH,
      accessToken,
      userId,
      username,
    };
    await setStorage({
      logins: logins.filter(login => login.type !== AccountType.TWITCH).concat(newLogin),
    });
  }
}
