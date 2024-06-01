# playwright

End-to-end testing for Send web applications.

## Specs

There are currently 3 kinds of specs:

- `*.anon.spec.ts` - anonymous specs, which do not require a user to be logged in.
- `*.logged-in.spec.ts` - authenticated specs, which require a user to be logged in, but not onboarded.
- `*.onboarded.spec.ts` - onboarded specs, which require a user to be logged in and onboarded.

These specs leverage fixtures to create the necessary users and data to run the tests using these personas.

## Snapshots

Snapshots are used to verify the state of the page. They are also used to generate a visual diff of the page. This is especially useful for visually inspecting the UI of a page without having to manually assert the state of the page.

Snapshots are created using the `expect(page).toHaveScreenshot()` method. This method takes a screenshot of the page and saves it to a file. The file name is based on the test name and the current time. Or by passing a `string | Buffer` to expect and calling `toMatchSnapshot()` on the returned value.

```typescript
await expect(page).toHaveScreenshot()
expect(await page.screenshot()).toMatchSnapshot('my-test.png')
```

To update the snapshots, you can use the `yarn playwright test --update-snapshots` command. It will update the snapshots in the directory.

```bash
# in another terminal, runs the activity.onboarded.spec.ts test at the 20th line
yarn playwright test --update-snapshots ./tests/activity\.onboarded\.spec\.ts:20
# runs all tests in the activity.onboarded.spec.ts file and updates the snapshots
yarn playwright test --update-snapshots ./tests/activity\.onboarded\.spec\.ts
```

See more information about snapshots in the [visual comparisons](https://playwright.dev/docs/test-snapshots) documentation.
