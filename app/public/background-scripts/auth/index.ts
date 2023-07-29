import { browser } from 'webextension-polyfill-ts';
import { getStorage, setStorage } from 'chrome-utils';
import { BADGE_DEFAULT_BACKGROUND_COLOR } from 'app-constants';
import { AccountType, MessageType } from 'types';
import { handleLogin as handleTwitchLogin } from './twitch';
import { handleLogin as handleYouTubeLogin } from './youtube';

export async function logout(type: AccountType) {
  const { logins = [] } = await getStorage(['logins']);
  setStorage('logins', logins.filter(login => login.type !== type) || []);
  browser.browserAction.setBadgeText({ text: '' });
  browser.browserAction.setBadgeBackgroundColor({
    color: BADGE_DEFAULT_BACKGROUND_COLOR,
  });
}

export default async function initAuth() {
  browser.runtime.onMessage.addListener(request => {
    switch (request.type) {
      case MessageType.LOGIN_TWITCH: {
        handleTwitchLogin();
        break;
      }
      case MessageType.LOGIN_YOUTUBE: {
        handleYouTubeLogin();
        break;
      }
      case MessageType.LOGOUT_TWITCH: {
        logout(AccountType.TWITCH);
        break;
      }
      case MessageType.LOGOUT_YOUTUBE: {
        logout(AccountType.YOUTUBE);
        break;
      }
      default: {
        break;
      }
    }
  });
}
