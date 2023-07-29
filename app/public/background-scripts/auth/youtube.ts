import { browser } from 'webextension-polyfill-ts';
import { getStorage, setStorage } from 'chrome-utils';
import { GOOGLE_CLIENT_ID } from 'app-constants';
import { AccountType, Login, OAUTH_AUTHORIZATION_CODE_SERVER_API_BASE } from 'types';
import { getRandomString, parseIdToken } from '../utils';

async function createAuthEndpoint() {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const redirectUri = await browser.identity.getRedirectURL();
  url.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'openid email profile https://www.googleapis.com/auth/youtube.readonly');
  url.searchParams.append('prompt', 'consent');
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('state', getRandomString());
  url.searchParams.append('nonce', getRandomString());
  return url.href;
}

export async function handleLogin() {
  const authEndpoint = await createAuthEndpoint();
  const state = new URL(authEndpoint).searchParams.get('state');
  const nonce = new URL(authEndpoint).searchParams.get('nonce');
  const redirectUri = new URL(authEndpoint).searchParams.get('redirect_uri');
  const returnUrl = await browser.identity.launchWebAuthFlow({
    url: authEndpoint,
    interactive: true,
  });
  const url = new URL(returnUrl);
  const params = url.hash ? new URLSearchParams(url.hash.substring(1)) : url.searchParams;
  if (state !== params.get('state')) throw new Error('Invalid state parameter during authorization');
  const code = params.get('code');
  const res = await fetch(
    `${OAUTH_AUTHORIZATION_CODE_SERVER_API_BASE}/google/exchange-code`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirectUri,
        code,
      }),
    },
  );
  const data = await res.json();
  const {
    id_token: idToken,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  } = data;
  const expiry = Date.now() / 1000 + (expiresIn as number);

  if (!idToken || !nonce) throw new Error();
  const userInfo = parseIdToken(idToken, nonce);
  const {
    email,
    name,
    sub: userId,
  } = userInfo;

  if (userId) {
    const { logins = [] } = await getStorage(['logins']);
    const newLogin: Login = {
      type: AccountType.YOUTUBE,
      userId,
      email,
      name,
      accessToken,
      refreshToken,
      expiry,
    };
    await setStorage({
      logins: logins.filter(login => login.type !== AccountType.YOUTUBE).concat(newLogin),
    });
  }
}
