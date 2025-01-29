/**
 * Home page is primarly used for onboarded users to see their balances and initiate deposits.
 */

import type { Page } from '@playwright/test'
import { mockUsdcTransfers } from 'app/features/home/utils/__mocks__/mock-usdc-transfers'
import { SUPABASE_URL } from 'app/utils/supabase/admin'
import debug from 'debug'
import { expect, test } from './fixtures/send-accounts'
import { shorten } from 'app/utils/strings'

let log: debug.Debugger

test.beforeEach(() => {
  log = debug(`test:activity:logged-in:${test.info().parallelIndex}`)
})

// @todo Heading checks need to be refactored to mobile only
// const heading = (page: Page) =>
//   page.getByRole('heading', { name: 'Home', exact: true }).and(page.getByText('Home'))

test('can visit token detail page', async ({ context, page }) => {
  await context.route(`${SUPABASE_URL}/rest/v1/activity_feed*`, async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({
      body: JSON.stringify(mockUsdcTransfers),
      headers: { 'content-type': 'application/json; charset=utf-8' },
      status: 200,
    })
    expect.soft(`${url.pathname}${url.search}`).toMatchSnapshot('token-details-history-url')
  })
  await page.goto('/?token=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') // usdc
  log('beforeEach', `url=${page.url()}`)
  // @todo: Heading checks need to be refactored to mobile only
  // await expect(heading(page)).toBeVisible()

  const history = page.getByTestId('TokenActivityFeed')

  await expect.soft(history.getByText('Withdraw')).toBeVisible()
  await expect
    .soft(history.getByText(shorten('0x93F2FA7A16a7365e3895b0F6E6Ac7a832d6c761a', 5, 4)))
    .toBeVisible()
  await expect.soft(history.getByText('10 USDC')).toBeVisible()

  // Button and label
  await expect.soft(history.getByText('Deposit')).toHaveCount(1)

  await expect.soft(history.getByText('/alice')).toBeVisible()
  await expect.soft(history.getByText('Received')).toBeVisible()
  await expect.soft(history.getByText('20 USDC')).toBeVisible()
  await expect
    .soft(history.getByText(shorten('0xa71CE00000000000000000000000000000000000', 5, 4)))
    .toBeVisible()
  await expect.soft(history.getByText('30 USDC')).toBeVisible()
  await expect
    .soft(history.getByText(shorten('0x93F2FA7A16a7365e3895b0F6E6Ac7a832d6c761a', 5, 4)))
    .toBeVisible()

  expect(page.getByTestId('TokenActivityFeed')).toBeVisible()
  // expect(await page.getByTestId('TokenActivityFeed').textContent()).toMatchSnapshot(
  //   'token-details-history.txt'
  // )
  // await expect(page.getByTestId('TokenActivityFeed')).toHaveScreenshot(
  //   'token-details-history.png',
  //   {
  //     timeout: 5_000,
  //   }
  // )
})
