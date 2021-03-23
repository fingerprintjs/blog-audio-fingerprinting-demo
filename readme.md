# [Audio fingerprint article](https://fingerprintjs.com/blog/audio-fingerprinting/) interactive demos

## Usage

You need to install [Node.js](https://nodejs.org) and [Yarn](https://yarnpkg.com) to run the application.

Install Yarn dependencies.
Open this directory in a terminal and run:

```bash
yarn install
```

### Quick run

```bash
yarn start
```

Then open one of the demos in a browser:
- http://localhost:8080
- http://localhost:8080/?demo=oscillator-options
- http://localhost:8080/?demo=dynamics-compressor-options
- http://localhost:8080/?demo=difference

Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal to stop.

### Production build

```bash
yarn build
```

The result HTML code will appear in the `dist` directory.

## Development

See [contributing.md](contributing.md)
