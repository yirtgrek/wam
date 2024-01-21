# Getting Started
After cloning the repo install the deps with:
```sh
npm install
```
You only have run `npm install` once.

Next to build the web extension run:
```sh
npm run build
```
This runs webpack and outputs a directory named `dist` that has our compiled web extension.

In your browser you can now load the extension.
- [edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading)
- [chrome](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [firefox](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) - Note: Firefox hasn't been tested yet

> Make sure you are loading the `dist` directory and not the `WAM` directory!

## Reloading

When you make changes rerun `npm run build` and in the extension menu reload the extension to see the changes.

