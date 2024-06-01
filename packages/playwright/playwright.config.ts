import { defineConfig, devices } from '@playwright/test'

// @ts-expect-error set __DEV__ for code shared between react-native
globalThis.__DEV__ = false

// validate environment ensuring we aren't talking to prod or staging or something
const _url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
if (!['127.0.0.1', 'localhost'].some((host) => _url.hostname === host)) {
  console.log(`

NEXT_PUBLIC_SUPABASE_URL is ${process.env.NEXT_PUBLIC_SUPABASE_URL}. Please update your environment to point to a local supabase instance.

    `)
  throw new Error('Tests are only allowed to run against a local supabase instance')
}

const baseURL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Useful for debugging */
  // timeout: 0,
  // globalTimeout: 0,
  // timeout: 60_000, // 60 seconds
  // globalTimeout: 30 * 60_000, // 30 minutes

  testDir: './tests',
  snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  // workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    process.env.CI ? ['github'] : ['list'],
    ['html', { host: '127.0.0.1', open: 'never' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Configure the video recording. */
    // video: {
    //   size: { width: 1366, height: 768 },
    //   mode: 'on',
    // },
  },

  /* Configure projects for major browsers */
  projects: [
    /* Test against desktop viewports. */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } },
    },
    // FIXME: something is wrong with webkit in CI github actions
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // FIXME: introduce these once tamagui adapt sheets correctly include dialog aria attributes
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI
      ? 'yarn workspace next-app run serve --port 3000'
      : 'yarn workspace next-app run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stderr: 'pipe',
    stdout: 'pipe',
    ignoreHTTPSErrors: false,
  },

  /**
   * **Make Visual Tests More Forgiving**
   * Out of the box, visual tests are very strict. If a single pixel fails, your test fails.
   * Thankfully, Playwright provides numerous controls for tuning how sensitive your visual tests should be.
   * Here are your options:
   * - `threshold`: How much must a single pixel vary for it to be considered different. Values are a percentage from 0 to 1, with 0.2 as the default.
   * - `maxDiffPixels`: The maximum number of pixels that can differ while still passing the test. By default, this option is disabled.
   * - `maxDiffPixelRatio`: The maximum percentage of pixels that can differ while still passing the test. Values are a percentage from 0 to 1, but this control is disabled by default.
   */
  expect: {
    toHaveScreenshot: {
      threshold: 0.25,
      maxDiffPixelRatio: 0.025,
      maxDiffPixels: 25,
    },
    toMatchSnapshot: {
      threshold: 0.25,
      maxDiffPixelRatio: 0.025,
      maxDiffPixels: 25,
    },
  },
})
