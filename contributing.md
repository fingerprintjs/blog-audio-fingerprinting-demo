# Contributing

## Code style

Use ESLint to check your code style:

```bash
yarn lint
```

## CSS styles

The demo must adjust exactly to the document size because it sits in iframes with fixed size.

All the styles are [CSS modules](https://github.com/css-modules/css-modules).
No CSS preprocessor is required here.

## DOM management

The application uses [Preact](https://preactjs.com).
It's a lightweight full-featured alternative to React.
React is replaced with Preact in the code using Webpack aliases.
Preact isn't used directly because the tools don't work well with JSX handled not by React.
