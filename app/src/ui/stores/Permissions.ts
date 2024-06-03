import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import browser from 'webextension-polyfill';
import { ORIGINS } from 'src/app-constants';
import { OriginType } from 'src/types';

interface OriginsPermissions {
  [OriginType.TWITCH]: boolean,
  [OriginType.YOUTUBE]: boolean,
  [OriginType.KICK]: boolean,
}

interface PermissionsStore {
  loading: boolean,
  setLoading: (isLoading: boolean) => void,
  origins: OriginsPermissions,
  setOrigins: (origins: Partial<OriginsPermissions>) => void,
  setOrigin: (key: keyof OriginsPermissions, value: boolean) => void,
}

export const usePermissions = create<PermissionsStore>()(set => ({
  loading: true,
  setLoading: loading => set({ loading }),
  origins: {
    [OriginType.TWITCH]: false,
    [OriginType.YOUTUBE]: false,
    [OriginType.KICK]: false,
  },
  setOrigins: origins => {
    set(old => ({
      origins: {
        ...old.origins,
        ...origins,
      },
    }));
  },
  setOrigin: (key, value) => {
    set(old => ({
      origins: { ...old.origins, [key]: value },
    }));
  },
}));

export function usePermissionsInitialization() {
  const setOrigins = usePermissions(store => store.setOrigins);
  const setLoading = usePermissions(store => store.setLoading);

  const fetchPermissions = useCallback(() => {
    browser.permissions.getAll().then(permissions => {
      const hasTwitchPermissions = ORIGINS[OriginType.TWITCH].every(origin => permissions.origins?.includes(origin));
      const hasYouTubePermissions = ORIGINS[OriginType.YOUTUBE].every(origin => permissions.origins?.includes(origin));
      const hasKickPermissions = ORIGINS[OriginType.KICK].every(origin => permissions.origins?.includes(origin));
      setOrigins({
        [OriginType.TWITCH]: hasTwitchPermissions,
        [OriginType.YOUTUBE]: hasYouTubePermissions,
        [OriginType.KICK]: hasKickPermissions,
      });
      setLoading(false);
    });
  }, [setOrigins, setLoading]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    const onChangedListener = (permissions: browser.Permissions.Permissions) => {
      fetchPermissions();
    };
    browser.permissions.onAdded.addListener(onChangedListener);
    browser.permissions.onRemoved.addListener(onChangedListener);
    return () => {
      browser.permissions.onAdded.removeListener(onChangedListener);
      browser.permissions.onRemoved.removeListener(onChangedListener);
    };
  }, [fetchPermissions]);
}
