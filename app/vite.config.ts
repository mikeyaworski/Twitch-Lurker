import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { crx, defineDynamicResource, ManifestV3Export } from '@crxjs/vite-plugin';
// import createFirefoxManifestPlugin from './vite-plugins/create-firefox-manifest';

import rawManifest from './manifest.json';

const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
const isFirefox = process.env.TARGET === 'FIREFOX';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'build', isFirefox ? 'firefox' : 'chrome');
const publicDir = resolve(__dirname, 'public');

function getManifest(): ManifestV3Export {
  return {
    ...rawManifest,
    // @ts-expect-error
    browser_specific_settings: isFirefox ? rawManifest.browser_specific_settings : undefined,
    background: isFirefox ? {
      scripts: [rawManifest.background.service_worker],
      type: 'module',
    } : rawManifest.background,
    web_accessible_resources: [
      defineDynamicResource({
        matches: ['https://*.twitch.tv/*'],
      }),
    ],
  };
}

export default defineConfig({
  resolve: {
    alias: {
      src: root,
    },
  },
  plugins: [
    react(),
    crx({
      manifest: getManifest(),
      browser: isFirefox ? 'firefox' : 'chrome',
      contentScripts: {
        injectCss: true,
      },
    }),
    // isFirefox && createFirefoxManifestPlugin(),
  ],
  publicDir,
  build: {
    outDir,
    sourcemap: isDev,
    emptyOutDir: !isDev,
    rollupOptions: {
      input: {
        fullscreen: 'src/ui/pages/fullscreen.html',
      },
    },
  },
});
