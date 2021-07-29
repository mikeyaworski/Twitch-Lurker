import { log } from '../../src/logging';
import { UNMUTE_INTERVAL_LENGTH } from '../../src/app-constants';

let unmuteInterval: NodeJS.Timeout | undefined;

function eventListener(e: Event) {
  // If the user interacts with the button, stop messing with it
  if (e.isTrusted && unmuteInterval) {
    clearInterval(unmuteInterval!);
  }
}

function unmute() {
  const SELECTOR = 'button[aria-label*=Unmute],button[aria-label*=unmute]';
  const element = document.querySelector(SELECTOR) as HTMLButtonElement;
  if (element) {
    log('Unmuting Twitch player', element);
    element.click();
    element.removeEventListener('click', eventListener);
    element.addEventListener('click', eventListener);
  }
}
unmuteInterval = setInterval(unmute, UNMUTE_INTERVAL_LENGTH);

function disableDownscale() {
  Object.defineProperty(document, 'hidden', { value: false, writable: false });
  Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
  Object.defineProperty(document, 'webkitVisibilityState', { value: 'visible', writable: false });
  document.dispatchEvent(new Event('visibilitychange'));
  document.hasFocus = () => true;

  // visibilitychange events are captured and stopped
  document.addEventListener('visibilitychange', e => {
    e.stopImmediatePropagation();
  }, true);

  // Set the player quality to "Source"
  window.localStorage.setItem('s-qs-ts', String(Math.floor(Date.now())));
  window.localStorage.setItem('video-quality', '{"default":"chunked"}');
}
disableDownscale();
