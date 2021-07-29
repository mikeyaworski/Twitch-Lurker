import { createContext, useEffect, useState } from 'react';
import { browser } from 'webextension-polyfill-ts';
import type { Channel } from 'types';

import { MESSAGE_TYPES } from 'app-constants';

const port = browser.runtime.connect();

function fetchChannels() {
  port.postMessage({ type: MESSAGE_TYPES.FETCH_CHANNELS });
}

type UseBackgroundPort = {
  channels: Channel[];
};

export default createContext<UseBackgroundPort>({
  channels: [],
});

export function useBackgroundPort(): UseBackgroundPort {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    port.onMessage.addListener(msg => {
      if (msg.type === MESSAGE_TYPES.SEND_CHANNELS) {
        setChannels(msg.data as Channel[]);
      }
    });
    fetchChannels();
  }, []);

  return {
    channels,
  };
}
