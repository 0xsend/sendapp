/**
 * Home page is primarly used for onboarded users to see their balances and initiate deposits.
 */

import debug from 'debug'
import { expect, test } from './fixtures/send-accounts'

let log: debug.Debugger

test.beforeEach(() => {
  log = debug(`test:activity:logged-in:${test.info().parallelIndex}`)
})

test('can visit token detail page', async ({ page }) => {
  await page.goto('/?token=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') // usdc
  log('beforeEach', `url=${page.url()}`)

  // Verify the token details page renders with key elements
  // Token name/symbol should be visible (exact match to avoid matching 'About USDC')
  await expect(page.getByText('USDC', { exact: true })).toBeVisible()

  // Key metrics heading should render (content loads asynchronously via CoinGecko API)
  await expect(page.getByRole('heading', { name: 'Key Metrics' })).toBeVisible()

  // About section heading should render
  await expect(page.getByRole('heading', { name: 'About USDC' })).toBeVisible()
})
