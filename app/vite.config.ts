import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { crx, ManifestV3Export } from '@crxjs/vite-plugin';
import createFirefoxManifestPlugin from './vite-plugins/create-firefox-manifest';

import rawManifest from './manifest.json';

const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
const isFirefox = process.env.TARGET === 'FIREFOX';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'build', isFirefox ? 'firefox' : 'chrome');
const publicDir = resolve(__dirname, 'public');

function getManifest(): ManifestV3Export {
  return {
    ...rawManifest,
    background: isFirefox ? {
      scripts: [rawManifest.background.service_worker],
      type: 'module',
    } : rawManifest.background,
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
      // Could use getManifest() here instead of using createFirefoxManifestPlugin()
      manifest: rawManifest,
      contentScripts: {
        injectCss: true,
      },
    }),
    isFirefox && createFirefoxManifestPlugin(),
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
