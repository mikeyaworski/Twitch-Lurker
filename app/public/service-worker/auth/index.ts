import browser from 'webextension-polyfill';
import { getFullStorage } from 'storage';
import { getYouTubeLogin } from 'utils';
import { setStorage } from 'chrome-utils';
import { BADGE_DEFAULT_BACKGROUND_COLOR } from 'app-constants';
import { AccountType, MessageType, Login, StorageType } from 'types';
import { login as loginTwitch } from './twitch';
import { login as loginYouTube } from './youtube';
import { login as loginKick } from './kick';

const storage = getFullStorage();

export async function logout(type: AccountType) {
  let newLogin: Login | undefined;
  switch (type) {
    case AccountType.YOUTUBE: {
      const existingLogin = getYouTubeLogin(storage);
      if (existingLogin && existingLogin.clientId && existingLogin.clientSecret) {
        newLogin = {
          type: AccountType.YOUTUBE_OAUTH_CREDENTIALS,
          clientId: existingLogin.clientId,
          clientSecret: existingLogin.clientSecret,
        };
      }
      setStorage({
        youtubeSubscriptions: null,
      }, StorageType.LOCAL);
      break;
    }
    default: break;
  }
  const newLogins = storage.logins.filter(login => login.type !== type) || [];
  if (newLogin) newLogins.push(newLogin);
  setStorage({ logins: newLogins });
  if (newLogins.length === 0) {
    browser.action.setBadgeText({ text: '' });
    browser.action.setBadgeBackgroundColor({
      color: BADGE_DEFAULT_BACKGROUND_COLOR,
    });
  }
}

export default async function initAuth() {
  browser.runtime.onMessage.addListener(request => {
    switch (request.type) {
      case MessageType.LOGIN_TWITCH: {
        loginTwitch();
        break;
      }
      case MessageType.LOGIN_YOUTUBE: {
        loginYouTube();
        break;
      }
      case MessageType.LOGIN_KICK: {
        loginKick();
        break;
      }
      case MessageType.LOGOUT: {
        logout(request.accountType as AccountType);
        break;
      }
      default: {
        break;
      }
    }
  });
}
