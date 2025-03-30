import { defineConfig, devices } from '@playwright/test'
import os from 'node:os'
import dotenv from 'dotenv'

import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') })

const cpus = os.cpus().length
// never scheduler more than 4 workers or up to 50% of the available cores
// this is due to concurrency issues within the send account sign up and resource contention
const workers = Math.min(4, Math.max(1, Math.floor(cpus * (Number.parseInt('50%', 10) / 100))))

// @ts-expect-error set __DEV__ for code shared between react-native
globalThis.__DEV__ = false

// validate environment ensuring we aren't talking to prod or staging or something
const _url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
if (!['127.0.0.1', 'localhost', 'host.docker.internal'].some((host) => _url.hostname === host)) {
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
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    process.env.CI ? ['github'] : ['list'],
    ['html', { host: '127.0.0.1', open: 'never' }],
    ['json', { outputFile: 'playwright-report/report.json' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Configure the video recording. */
    ...(Boolean(process.env.PLAYWRIGHT_RECORD) === true
      ? {
          video: {
            size: { width: 1366, height: 768 },
            mode: 'on',
          },
        }
      : undefined),
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
    // reuseExistingServer: !process.env.CI,
    reuseExistingServer: true,
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

  // need to handle differences on various platforms and give developers ability to update snapshots cross platform easily
  // add docker image with snapshot capabiltities

  snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
  // expect: {
  //   toHaveScreenshot: {
  //     threshold: 0.25,
  //     maxDiffPixelRatio: 0.125,
  //     // maxDiffPixels: 25,
  //   },
  //   toMatchSnapshot: {
  //     threshold: 0.25,
  //     maxDiffPixelRatio: 0.125,
  //     // maxDiffPixels: 25,
  //   },
  // },
})
