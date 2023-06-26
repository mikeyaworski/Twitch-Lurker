import { browser } from 'webextension-polyfill-ts';
import { setStorage } from '../../src/chrome-utils';
import { CLIENT_ID, MESSAGE_TYPES } from '../../src/app-constants';

function getRandomString() {
  return Math.random().toString(36).substring(2, 15);
}

async function createAuthEndpoint() {
  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  const redirectUri = await browser.identity.getRedirectURL();
  url.searchParams.append('client_id', CLIENT_ID);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'token id_token');
  url.searchParams.append('scope', 'openid user:read:follows');
  url.searchParams.append('force_verify', 'true');
  url.searchParams.append('state', getRandomString());
  url.searchParams.append('nonce', getRandomString());
  return url.href;
}

async function handleLogin() {
  const authEndpoint = await createAuthEndpoint();
  const state = new URL(authEndpoint).searchParams.get('state');
  const redirectUrl = await browser.identity.launchWebAuthFlow({
    url: authEndpoint,
    interactive: true,
  });
  const url = new URL(redirectUrl);
  const params = url.hash ? new URLSearchParams(url.hash.substring(1)) : url.searchParams;
  if (state !== params.get('state')) throw new Error('Invalid state parameter during authorization');
  const accessToken = params.get('access_token');
  const idToken = params.get('id_token');
  const userInfoBase64 = idToken?.split('.')[1];
  if (!userInfoBase64) throw new Error();
  const userInfo = JSON.parse(atob(userInfoBase64));

  await setStorage('accessToken', accessToken);
  await setStorage('userId', userInfo.sub);
}

export function logout() {
  setStorage('accessToken', null);
  setStorage('userId', null);
  browser.browserAction.setBadgeText({ text: '' });
}

export default async function initAuth() {
  browser.runtime.onMessage.addListener(request => {
    switch (request.type) {
      case MESSAGE_TYPES.LOGIN: {
        handleLogin();
        break;
      }
      case MESSAGE_TYPES.LOGOUT: {
        logout();
        break;
      }
      default: {
        break;
      }
    }
  });
}
