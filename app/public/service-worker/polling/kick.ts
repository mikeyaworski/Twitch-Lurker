import {
  KICK_API_BASE,
} from 'app-constants';
import { ChannelType, KickChannel } from 'types';

const getApi = () => async (route: string, params: [string, string | number][] = []) => {
  const url = new URL(`${KICK_API_BASE}${route}`);
  params.forEach(([key, value]) => {
    if (value) url.searchParams.append(key, String(value));
  });
  const res = await fetch(url.href, {
    method: 'GET',
  });
  const json = await res.json();
  if (res.status >= 400) throw json;
  return json;
};

function fetchArbitraryChannels(usernames: string[]) {
  return Promise.all(usernames.map(username => {
    return getApi()(`/channels/${username}`);
  }));
}

export async function fetchData(addedChanels: string[]): Promise<KickChannel[]> {
  const channels = await fetchArbitraryChannels(addedChanels);

  return channels.map(channelData => {
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
