import fs from 'node:fs';
import path from 'node:path';
import { Plugin } from 'vite';

function createFirefoxManifestPlugin(manifestName = 'manifest.json'): Plugin {
  return {
    name: 'create-firefox-manifest',
    writeBundle: ({ dir: outDir }, bundle) => {
      if (outDir && manifestName in bundle) {
        const manifestData = bundle[manifestName];
        if ('source' in manifestData) {
          const manifest = 'source' in manifestData && manifestData.source;
          if (typeof manifest === 'string') {
            const manifestJson = JSON.parse(manifest);
            if (manifestJson.background?.service_worker) {
              manifestJson.background = {
                scripts: [manifestJson.background.service_worker],
                type: 'module',
              };
            }
            fs.writeFileSync(path.join(outDir, manifestData.fileName), JSON.stringify(manifestJson, null, 2));
          }
        }
      }
    },
  };
}

export default createFirefoxManifestPlugin;
