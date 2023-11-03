import { browser } from 'webextension-polyfill-ts';
import { getStorage, setStorage } from 'chrome-utils';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_OAUTH_API_BASE,
  OAUTH_AUTHORIZATION_CODE_SERVER_API_BASE,
} from 'app-constants';
import {
  AccountType,
  Login,
  REFRESH_TOKEN_EXPIRY_THRESHOLD_SECONDS,
  YouTubeOAuthCredentials,
} from 'types';
import { getFullStorage } from 'storage';
import { error, log } from 'logging';
import { getRandomString, parseIdToken } from '../utils';

const storage = getFullStorage();

async function createAuthEndpoint(clientId: string) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const redirectUri = await browser.identity.getRedirectURL();
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'openid email profile https://www.googleapis.com/auth/youtube.readonly');
  url.searchParams.append('prompt', 'consent');
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('state', getRandomString());
  url.searchParams.append('nonce', getRandomString());
  return url.href;
}

export async function login() {
  const { logins } = await getStorage(['logins']);
  const clientIdLogin = logins?.find((login): login is YouTubeOAuthCredentials => login.type === AccountType.YOUTUBE_OAUTH_CREDENTIALS);
  const clientId = clientIdLogin?.clientId || GOOGLE_CLIENT_ID;
  const clientSecret = clientIdLogin?.clientSecret;

  const authEndpoint = await createAuthEndpoint(clientId);
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
  if (!code) throw new Error('No code returned to log in with');
  const exchangeCodeUrl = clientSecret
    ? GOOGLE_OAUTH_API_BASE
    : `${OAUTH_AUTHORIZATION_CODE_SERVER_API_BASE}/google/exchange-code`;
  const exchangeCodeBody = clientSecret
    ? {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    } : {
      redirectUri,
      code,
    };
  const res = await fetch(
    exchangeCodeUrl,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exchangeCodeBody),
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
      clientId,
      clientSecret,
      accessToken,
      refreshToken,
      expiry,
    };
    const filterTypes: AccountType[] = [AccountType.YOUTUBE, AccountType.YOUTUBE_OAUTH_CREDENTIALS];
    await setStorage({
      logins: logins.filter(login => !filterTypes.includes(login.type)).concat(newLogin),
    });
  }
}

export async function tryRefreshToken({
  clientId,
  clientSecret,
  refreshToken,
  accessToken,
  expiry,
}: {
  clientId?: string,
  clientSecret?: string,
  refreshToken: string,
  accessToken: string,
  expiry: number, // epoch in seconds
}): Promise<{
  accessToken: string,
  expiry: number, // epoch in seconds
}> {
  const secondsUntilExpiry = expiry - Date.now() / 1000;
  if (secondsUntilExpiry < REFRESH_TOKEN_EXPIRY_THRESHOLD_SECONDS) {
    log('Refreshing YouTube access token');
    const url = clientSecret
      ? GOOGLE_OAUTH_API_BASE
      : `${OAUTH_AUTHORIZATION_CODE_SERVER_API_BASE}/google/exchange-code`;
    const body = clientSecret
      ? {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      } : {
        refreshToken,
      };
    const res = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();
    if (res.status >= 400) {
      error(`${data.error}: ${data.error_description}`);
      return {
        accessToken,
        expiry,
      };
    }
    const newAccessToken = data.access_token;
    const newExpiry = Date.now() / 1000 + (data.expires_in as number);
    setStorage({
      logins: storage.logins.map(login => (login.type === AccountType.YOUTUBE && login.accessToken === accessToken
        ? { ...login, accessToken: newAccessToken, expiry: newExpiry }
        : login)),
    });
    return {
      accessToken: newAccessToken,
      expiry: newExpiry,
    };
  }
  return {
    accessToken,
    expiry,
  };
}
