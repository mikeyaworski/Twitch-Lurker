import { useEffect } from 'react';
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

  useEffect(() => {
    browser.permissions.getAll().then(permissions => {
      setOrigins({
        [OriginType.TWITCH]: Boolean(permissions.origins?.includes(ORIGINS[OriginType.TWITCH])),
        [OriginType.KICK]: Boolean(permissions.origins?.includes(ORIGINS[OriginType.KICK])),
        [OriginType.YOUTUBE]: Boolean(permissions.origins?.includes(ORIGINS[OriginType.YOUTUBE])),
      });
      setLoading(false);
    });
  }, [setOrigins, setLoading]);

  useEffect(() => {
    const onChangedListener = (newValue: boolean) => (permissions: browser.Permissions.Permissions) => {
      const newPermissions: Partial<OriginsPermissions> = {};
      permissions.origins?.forEach(origin => {
        switch (origin) {
          case ORIGINS[OriginType.TWITCH]: {
            newPermissions[OriginType.TWITCH] = newValue;
            break;
          }
          case ORIGINS[OriginType.YOUTUBE]: {
            newPermissions[OriginType.YOUTUBE] = newValue;
            break;
          }
          case ORIGINS[OriginType.KICK]: {
            newPermissions[OriginType.KICK] = newValue;
            break;
          }
          default: break;
        }
      });
      setOrigins(newPermissions);
    };
    const onAddedListener = onChangedListener(true);
    const onRemovedListener = onChangedListener(false);
    browser.permissions.onAdded.addListener(onAddedListener);
    browser.permissions.onRemoved.addListener(onRemovedListener);
    return () => {
      browser.permissions.onAdded.removeListener(onAddedListener);
      browser.permissions.onRemoved.removeListener(onRemovedListener);
    };
  }, [setOrigins]);
}
