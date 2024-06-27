
# Send App

This is the `app` package, the main package of Send App. It contains the screens, components, and utilities. It is a react native app built with [Solito](https://solito.dev), [Tamagui](https://tamagui.dev), and [Expo](https://expo.dev).

Everything is organized into screens. Screens are composed of components and utilities. The screens are imported into platform specific applications found in the root `apps` folder. For now, there are only two apps, `expo` and `next`. The `expo` app is the native app built with [Expo](https://expo.dev) and the `next` app is a web app built with [Next.js](https://nextjs.org) and the pages router.

## Testing

Tests are written using [Jest](https://jestjs.io/docs/getting-started) and [React Native Testing Library](https://callstack.github.io/react-native-testing-library/docs/start/intro). The tests are meant to be run offline and without any network access. To do this, only the native platform is emulated. All platform specific APIs and backends are mocked.

You can run tests with `yarn test` or `yarn test --watch` to run the tests in watch mode.

### Mocks

The automatic mocks are found in `__mocks__` folders at the root of the `app` folder as a sibiling to the `package.json`. Files that match the import path of an existing node module or `app` package will be automatically mocked. For example, if you have a file at `packages/app/utils/useProfileLookup.ts`, an automatic mock is found at `packages/app/__mocks__/app/utils/useProfileLookup.ts`. These automatic mocks are mocked even without a call to `jest.mock` inside the test file.

#### Mocking ES6 Modules

The automatic mocks are powerful and make it easy to share mocks across multiple test files. However, it can be tricky to understand the mocking logic and where the mocks are coming from. When writing a new mock file, be sure to include a default export that also includes an `esModule` property set to `true`. This will ensure that the mock is treated as an ES6 module and will be automatically mocked and included in the test file properly.

```ts
export default {
  __esModule: true,
  // mock logic
}
```
