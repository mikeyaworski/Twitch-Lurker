import browser from 'webextension-polyfill';
import { BADGE_TEXT_COLOR, BADGE_DEFAULT_BACKGROUND_COLOR } from 'src/app-constants';
import { log, error } from 'src/logging';
import { requestNecessaryHostPermissions } from 'src/utils';
import initAuth from './auth';
import initPolling from './polling';

browser.action.setBadgeBackgroundColor({
  color: BADGE_DEFAULT_BACKGROUND_COLOR,
});
if (browser.action.setBadgeTextColor) {
  browser.action.setBadgeTextColor({
    color: BADGE_TEXT_COLOR,
  });
}

initAuth();
initPolling();

// This startup listener is important, even if the code inside does nothing.
// It ensures that the service worker is active when the browser profile is opened.
// This is especially important for Firefox, since the background script will not run without user interaction or this listeneer.
// I believe the service worker eventually gets activated on Chrome if a scheduled alarm for polling goes off.
browser.runtime.onStartup.addListener(() => {
  log('Started');
});

browser.runtime.onInstalled.addListener(() => {
  log('Installed');
  browser.contextMenus.create({
    id: 'Browser Action',
    title: 'Open Full Page Viewer',
    contexts: ['action'],
  }, () => {
    if (browser.runtime.lastError) {
      error(browser.runtime.lastError);
    }
  });
  browser.contextMenus.create({
    id: 'Request Host Permissions',
    title: 'Request Host Permissions',
    contexts: ['action'],
  }, () => {
    if (browser.runtime.lastError) {
      error(browser.runtime.lastError);
    }
  });
});

browser.contextMenus.onClicked.addListener(async info => {
  switch (info.menuItemId) {
    case 'Browser Action': {
      const url = browser.runtime.getURL('/src/ui/pages/fullscreen.html');
      await browser.tabs.create({
        url,
        active: true,
      });
      break;
    }
    case 'Request Host Permissions': {
      await requestNecessaryHostPermissions();
      break;
    }
    default: break;
  }
});
