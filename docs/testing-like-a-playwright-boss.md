
# Testing Like a Playwright Boss

This is a guide to testing like a playwright boss. It dives into how to leverage playwrght to test Send app. It also covers how to debug and troubleshoot tests.

## Setup

Ensure you have already followed the [CONTRIBUTING](/CONTRIBUTING.md) guide.

- Install [VSCode](https://code.visualstudio.com/): A code editor that supports running and debugging Playwright tests.
- Install ["ms-playwright.playwright"](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright): A VSCode extension that provides syntax highlighting and code completion for Playwright tests.
- Install [direnv](https://direnv.net/): A tool that loads environment variables from `.envrc` files.
- Install ["mkhl.direnv"](https://marketplace.visualstudio.com/items?itemName=mkhl.direnv): A VSCode extension that load environment variables from `.envrc` files into the VSCode environment.
- Install browsers:
  - Using VSCode: Press Shift+Command+P to open the Command Palette in VSCode, type 'Playwright' and select 'Install Playwright Browsers'.
  - Using the Playwright CLI: Run `npx playwright install chromium firefox webkit` to install the browsers.
Once those are installed, you will need to allow the `.envrc` file to load environment variables. Any time it changes, it should prompt you to reload the VSCode environment.

For the rest of the guide, we will assume you are using VSCode.

### Running Tests

You'll want to visit the **Testing** tab in the VSCode sidebar. From there, in the **Test Explorer** panel, you can run and debug tests.

There should be icons for running and debugging tests. Typically, I only run one test at a time. There are also a number of settings that are available for Playwright when running from VSCode. You can find them at the bottom of the **Testing** sidebar.

A few of my favorite settings are:

- **Projects**: This is where you can select which projects to run tests for. Typically, I select one, either chromium or firefox.
- **Settings**: This is where you can select which settings to use for the test run such as running the browser in headless mode or not.
- **Tools**:
  - **Pick Locator** allows you to select which locator to use for finding elements on the page from the currently running test and open browser.
  - **Record New**: Gives you the ability to record a new test
  - **Record at Cursor**: Gives you the ability to record a test which will input at the current editor's pane cursor position.

### Debugging Tests

When debugging tests, you can use the **Debug Console** to see the output of the test. You can also use the **Debug Console** to interact with the browser.

This runs Playwright in debug mode which will pause at breakpoints and allow you to interact with the browser. It also removes the global timeout which is set by default to 30 seconds. This is useful for debugging tests as it allows you to run tests for longer periods of time.

You also have access to the console developer tools which can be useful for debugging to see what is happening in the browser.

### Writing Tests

Playwright tests are written in TypeScript. You can find the test files in the [`/packages/playwright/tests`](/packages/playwright) directory. There are a number of examples of tests in there. Send app leverages a number of fixtures to make testing easier. These fixtures are located in the [`/packages/playwright/tests/fixtures`](/packages/playwright/tests/fixtures) directory.

#### Considerations

You want to put yourself in the shoes of a user, not a developer. However, you should isolate the feature you are testing as much as possible. E.g. auth vs onboarding vs sending tokens. They are all different features and should be tested separately. Use fixtures to isolate them and reuse them across tests.

#### Test Recording

Use the **Record New** button or **Record at Cursor** to record a new tests or use the pick locator to select the locator to use for the test. This way you can easily interact with the browser and see what is happening.

## Non-VSCode Setup (Playwright CLI)

Running playwright tests in VSCode is a great way to get started, but you can also leverage the playwright CLI to run tests and debug them. You can use the [**Playwright Inspector**](https://playwright.dev/docs/inspector) to debug tests. To start Playwright in debug mode, you can run the following command:

```shell
cd packages/playwright
npx playwright test --debug
```

This will run the tests in debug mode and pause at breakpoints. There should be a popup which gives you commands during this interactive debugging session.
