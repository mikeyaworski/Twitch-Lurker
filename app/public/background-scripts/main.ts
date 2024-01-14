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

browser.contextMenus.create({
  title: 'Open Full Page Viewer',
  contexts: ['browser_action'],
  onclick: async () => {
    // TODO: Update this to use a separate document once the project is migrated from CRA to Vite
    const url = browser.extension.getURL('index.html');
    await browser.tabs.create({
      url,
      active: true,
    });
  },
});
