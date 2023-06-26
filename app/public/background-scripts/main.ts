import { browser } from 'webextension-polyfill-ts';
import { BADGE_TEXT_COLOR, BADGE_DEFAULT_BACKGROUND_COLOR } from '../../src/app-constants';
import initAuth from './auth';
import initPolling from './polling';

browser.browserAction.setBadgeBackgroundColor({
  color: BADGE_DEFAULT_BACKGROUND_COLOR,
});
if (browser.browserAction.setBadgeTextColor) {
  browser.browserAction.setBadgeTextColor({
    color: BADGE_TEXT_COLOR,
  });
}

initAuth();
initPolling();
