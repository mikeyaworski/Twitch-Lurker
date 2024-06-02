# Twitch Lurker

## Extension/Addon Links

Chrome: https://chrome.google.com/webstore/detail/fkjghajhfjamfjcmdkbangbeogbagnjf

Firefox: https://addons.mozilla.org/en-US/firefox/addon/twitch-lurker/

## Donations

This project was sponsored and conceptualized by ErianasVow.

<a href="https://www.buymeacoffee.com/ErianasVow" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Local Development

1. `git clone ...`
1. `cd app` and `npm run build:chrome` (or `npm run build:firefox`)
1. The source folder for the extension/addon is in `app/build/chrome` (or `app/build/firefox`)

If you are making changes to the service worker, content script or manifest, then you need to refresh the extension at `chrome://extensions`. If you are making changes to one of the UI pages, you do not need to refresh the chrome extension (just re-open the page/popup).

We have the script `npm run watch:chrome` (or `npm run watch:firefox`), which continuously builds the app as you make changes.

There are a number of shorthand scripts for convenience:

| Script | Shorthand Script |
| --- | --- |
| `npm run build:chrome` | `npm run bc`, `npm run build` |
| `npm run build:firefox` | `npm run bf` |
| `npm run watch:chrome` | `npm run wc`, `npm run watch` |
| `npm run watch:firefox` | `npm run wf` |

## Project Structure

### General Overview

There are three major components to this:

- Service worker
- Content script
- UI pages (built with React)

The library used for the build process is Vite. To package the build properly for browser extensions, we use the Vite plugin `@crxjs/vite-plugin`. The application code is effectively the same between Chrome and Firefox, but the manifest differs, so the build process creates a different build output for Firefox.

- All of the application code is located in `app/src`.
- The UI pages (React code) is located in `app/src/ui`. This is the code that creates our popup window and full page viewer.
- The `app/public` folder contains assets used for the manifest definition and for the UI pages. These assets are copied directly to the build output directory, so they will be at the root of the build.
- The manifest is located at `app/manifest.json`. The manifest is altered before being put in the build, so references to pre-transpiled files (e.g. TypeScript files) are used because those get transpiled and the manifest gets altered as part of the build process.

## Automated Deployment

This project uses GitHub actions to run checks and automatic deployments. All PRs created will run a "test" workflow, which simply runs `npm run test`, `npm run build:chrome` and `npm run build:firefox`. If this fails, it means there is either a lint error, a TypeScript error, or the project did not build for some other reason. This workflow is required to pass before any PR can be merged into master.

Once a commit is made to master (e.g. a PR is merged), two "deploy" workflows will run (one for Firefox and one for Chrome). These workflows build the extension, packages it and deploys it. If the manifest version number is *not* bumped, then Chrome/Firefox won't accept the package and the workflow will fail, which is fine.

### Version bumping

To bump the version (and therefore update the extension in the store), make a separate PR with *just the version bump*. Not every PR needs to bump the version number afterward. Multiple PRs can be merged to master, then have the version number bumped at a later date to deploy all the changes at once. This also lets us revert commits cleanly without including a version rollback (which is not possible).

Version bumps will loosely follow [semantic versioning](https://semver.org/). The version isn't actually that important since we are not a dependency to anything, but it's our convention.

## Making a PR

As mentioned, your code will need to build and pass the linter before it can be merged into master. In addition to that, at least one reviewer with write access will need to approve the PR. Once merged, it goes through the automated deployment process, as mentioned above.

If your PR is addressing an issue, please close the issue and reference the PR on the issue.
