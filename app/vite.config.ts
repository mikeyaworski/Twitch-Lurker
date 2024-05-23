import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { crx, ManifestV3Export } from '@crxjs/vite-plugin';

import manifest from './manifest.json';

const isDev = process.env.ENVIRONMENT === 'development';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'build');
const publicDir = resolve(__dirname, 'public');

export default defineConfig({
  resolve: {
    alias: {
      src: root,
    },
  },
  plugins: [
    react(),
    crx({
      manifest: manifest as ManifestV3Export,
      contentScripts: {
        injectCss: true,
      },
    }),
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
