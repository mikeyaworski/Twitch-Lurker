import browser from 'webextension-polyfill';
import { getFullStorage } from 'src/storage';
import { getAreAllLoginsEqual, getYouTubeLogin } from 'src/utils';
import { setStorage } from 'src/chrome-utils';
import { BADGE_DEFAULT_BACKGROUND_COLOR } from 'src/app-constants';
import { AccountType, MessageType, Login, StorageType } from 'src/types';
import { login as loginTwitch } from './twitch';
import { login as loginYouTube } from './youtube';
import { login as loginKick } from './kick';

const storage = getFullStorage();

export async function logout(type: AccountType) {
  let newLogin: Login | undefined;
  switch (type) {
    case AccountType.YOUTUBE: {
      // YouTube logins that use custom OAuth credentials
      // need to be reverted to the intermediate step
      // which still keeps track of their credentials
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
  // Firefox (but not Chrome) will trigger storage change events even if the value is semantically the same.
  // To avoid an infinite loop (since a storage change for logins will trigger polling again),
  // we avoid setting the storage if nothing has changed.
  if (!getAreAllLoginsEqual(storage.logins, newLogins)) {
    setStorage({ logins: newLogins });
  }
  if (newLogins.length === 0) {
    browser.action.setBadgeText({ text: '' });
    browser.action.setBadgeBackgroundColor({
      color: BADGE_DEFAULT_BACKGROUND_COLOR,
    });
  }
}

browser.notifications.onClicked.addListener(async (notificationId: string) => {
  if (notificationId === 'twitch-logged-out') {
    loginTwitch();
  }
});

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
