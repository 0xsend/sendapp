import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv-flow'

// load env vars
dotenv.config({
  path: path.resolve(__dirname, '..', '..'),
  silent: true,
})

// validate environment ensuring we aren't talking to prod or staging or something
if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321') {
  console.log(`

NEXT_PUBLIC_SUPABASE_URL is ${process.env.NEXT_PUBLIC_SUPABASE_URL}. Please update your environment to point to a local supabase instance.

    `)
  throw new Error('Tests are only allowed to run against a local supabase instance')
}

const port = process.env.CI ? 8151 : 3000

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
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    process.env.CI ? ['github'] : ['list'],
    ['html', { host: '127.0.0.1', open: 'never' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://127.0.0.1:${port}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    /* Test against desktop viewports. */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

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
      ? 'yarn workspace next-app run serve'
      : `yarn workspace next-app run dev --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
})
