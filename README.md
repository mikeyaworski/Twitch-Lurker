# Twitch Lurker

## Extension/Addon Links

Chrome: https://chrome.google.com/webstore/detail/fkjghajhfjamfjcmdkbangbeogbagnjf

Firefox: https://addons.mozilla.org/en-US/firefox/addon/twitch-lurker/

## Donations

This project was sponsored and conceptualized by ErianasVow.

<a href="https://www.buymeacoffee.com/ErianasVow" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Local Development

1. `git clone ...`
1. `cd app` and `npm run build:all`
1. The source folder for the extension/addon is in `app/build`.
1. You can build the background/content scripts separately from the popup.
    - `npm run build:all` builds both.
    - `npm run build:popup` builds just the popup (longest wait time).
    - `npm run build:scripts` builds just the background/content scripts (shortest wait time).

    If you are making changes to background/content scripts, then you need to refresh the extension at `chrome://extensions`.

    If you are making changes to the popup window, you do not need to refresh the chrome extension (just re-open the popup).

We have the script `npm run watch:scripts`, which continuously builds the background/content scripts as you make changes, but you still have to refresh the extension to see the changes. We also have the command `npm run watch:popup` which updates the popup as you make changes. You will need to close/reopen the popup to see the changes, but no need to refresh the extension.

## Project Structure

### General Overview

There are two major components to this:

- Background scripts
- Content scripts
- React components

Depsite all the files you see, the resulting package uploading to Chrome/Firefox is simply `manifest.json`, our background/content scripts, and a popup (`index.html`) that is rendered when you click the extension/addon icon.

Our React components are bundled to create our popup. Our `app/public/background-scripts/main.ts` is bundled to create our background script. Our `app/public/content-scripts/main.ts` is bundled to create our content script. All extension/addon files (icons, manifest, background scripts and content scripts) must be placed inside `app/public`. They will be copied over to `app/build`.

`npm run build:prod` does two things (in this order):

1. `rollup` is used to bundle all background scripts into one file called `background-script-bundle.js` and all content scripts into `content-script-bundle.js`.
  
    This allows us to use the latest ECMAScript and have great organization of our scripts. `manifest.json` lists only `background-script-bundle.js` as a background script and `content-script-bundle.js` as a content script, so `rollup` is expected to be run before packaging the extension (it builds those files).

    `app/public/background-scripts/main.ts` is the entry point for bundling our background scripts (similar for content scripts). So `main.ts` will import other files, like `app-constants.ts`.

2. This project uses `create-react-app` to bootstrap the React app (all of the `app` directory). `react-scripts build` is run, which bundles everything from `app/src` and `app/public` to `app/build`.

    All of the React componentes are bundled together and rendered on the DOM via the entry point `app/src/index.tsx`. The bundled JS and CSS files are injected into `app/public/index.html` and then the bundled `index.html` is put into `app/build`.
  
    Note that all of of our `app/public` will be copied into `app/build`, so that includes our `manifest.json`, `background-script-bundle.js`, `content-script-bundle.js`, and other extension/addon files. Therefore, our `manifest.json` uses all of those files which are bundled into the `app/build` directory with it (`index.html` and `background-script-bundle.js`). Our `app/build` directory can now be zipped and used as a packaged submission to Chrome/Firefox.

### tsconfig.json

There are three `tsconfig` files:
- `tsconfig.json`
    
    For our React code and linter.
- `tsconfig.background-scripts.json`
    
    For just our background scripts (manually specified in our Rollup config).
- `tsconfig.content-scripts.json`
    
    For just our content scripts (manually specified in our Rollup config).

`baseUrl: './src'` in `tsconfig.json` is used so that imports within any of our React components can use a path relative to `app/src`. E.g. a React file deeply nested in directories can use `import constants from 'app-constants'` since `app-constants` is in `app/src`, rather than something like `import constants from '../../../app-constants`.

Note that background/content scripts cannot take advantage of this. This would be something nice to implement in the future.

## Automated Deployment

This project uses GitHub actions to run checks and automatic deployments. All PRs created will run a "test" workflow, which simply runs `npm run test` and `npm run build:prod`. If this fails, it means there is either a lint error, a TypeScript error, or the project did not build for some other reason. This workflow is required to pass before any PR can be merged into master.

Once a commit is made to master (e.g. a PR is merged), two "deploy" workflows will run (one for Firefox and one for Chrome). These workflows build the extension, packages it and deploys it. If the manifest version number is *not* bumped, then Chrome/Firefox won't accept the package and the workflow will fail, which is fine.

### Version bumping

To bump the version (and therefore update the extension in the store), make a separate PR with *just the version bump*. Not every PR needs to bump the version number afterward. Multiple PRs can be merged to master, then have the version number bumped at a later date to deploy all the changes at once. This also lets us revert commits cleanly without including a version rollback (which is not possible).

Version bumps will loosely follow [semantic versioning](https://semver.org/). The version isn't actually that important since we are not a dependency to anything, but it's our convention.

## Making a PR

As mentioned, your code will need to build and pass the linter before it can be merged into master. In addition to that, at least one reviewer with write access will need to approve the PR. Once merged, it goes through the automated deployment process, as mentioned above.

If your PR is addressing an issue, please close the issue and reference the PR on the issue.
