import {
  KICK_API_BASE,
} from 'src/app-constants';
import { error } from 'src/logging';
import { ChannelType, KickChannel } from 'src/types';
import { notEmpty } from 'src/utils';

const getApi = () => async (route: string, params: [string, string | number][] = []) => {
  const href = `${KICK_API_BASE}${route}`;
  const url = new URL(href);
  params.forEach(([key, value]) => {
    if (value) url.searchParams.append(key, String(value));
  });
  const res = await fetch(url.href, {
    method: 'GET',
  });
  if (res.status >= 400) throw new Error(`Error fetching ${href}: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json;
};

function fetchArbitraryChannels(usernames: string[]) {
  return Promise.all(usernames.map(async username => {
    try {
      const data = await getApi()(`/channels/${username}`);
      return data;
    } catch (err) {
      error(err);
      return null;
    }
  }));
}

export async function fetchData(addedChanels: string[]): Promise<KickChannel[]> {
  const channels = await fetchArbitraryChannels(addedChanels);

  return channels.filter(notEmpty).map(channelData => {
    const stream = channelData.livestream;
    const channel: KickChannel = {
      type: ChannelType.KICK,
      username: channelData.user.username.toLowerCase(),
      profilePic: channelData.user?.profile_pic,
      displayName: channelData.user.username,
    };
    if (stream) {
      channel.viewerCount = stream.viewer_count;
      channel.category = stream.categories?.[0]?.name;
      channel.title = stream.session_title;
      channel.thumbnail = stream.thumbnail?.url;
      channel.start = stream.start_time;
    }
    return channel;
  });
}
