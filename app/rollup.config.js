import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import typescript from '@rollup/plugin-typescript';

const contentScriptConfig = {
  input: 'public/content-scripts/main.ts',
  output: {
    file: 'build/content-script-bundle.js',
    format: 'esm',
  },
  plugins: [
    commonjs({ extensions: ['.js', '.ts'] }),
    nodePolyfills(),
    resolve({
      browser: true,
    }),
    typescript({
      tsconfig: './tsconfig.content-scripts.json',
    }),
    terser({
      output: {
        comments: false,
      },
    }),
  ],
};

const backgroundScriptConfig = {
  input: 'public/background-scripts/main.ts',
  output: {
    file: 'build/background-script-bundle.js',
    format: 'esm',
  },
  plugins: [
    commonjs({ extensions: ['.js', '.ts'] }),
    nodePolyfills(),
    resolve({
      browser: true,
    }),
    typescript({
      tsconfig: './tsconfig.background-scripts.json',
    }),
    terser({
      output: {
        comments: false,
      },
    }),
  ],
};

// Output to both build/ and public/ directories so that when building the popup:
// 1. It will copy the bundles from public/ into build/
//    (if they are not in public/, then the existing ones in build/ will be removed),
// 2. When using npm run watch:cs, it will output the bundles directly to build/ as well,
//    so that we can refresh the extension without having to copy the bundle files from public/ into build/ manually.
export default [
  contentScriptConfig,
  {
    ...contentScriptConfig,
    output: {
      ...contentScriptConfig.output,
      file: 'public/content-script-bundle.js',
    },
  },
  backgroundScriptConfig,
  {
    ...backgroundScriptConfig,
    output: {
      ...backgroundScriptConfig.output,
      file: 'public/background-script-bundle.js',
    },
  },
];
