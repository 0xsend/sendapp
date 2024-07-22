/**
 * Home page is primarly used for onboarded users to see their balances and initiate deposits.
 */

import type { Page } from '@playwright/test'
import { mockUsdcTransfers } from 'app/features/home/utils/__mocks__/mock-usdc-transfers'
import { SUPABASE_URL } from 'app/utils/supabase/admin'
import debug from 'debug'
import { expect, test } from './fixtures/send-accounts'

let log: debug.Debugger

test.beforeEach(() => {
  log = debug(`test:activity:logged-in:${test.info().parallelIndex}`)
})

const heading = (page: Page) =>
  page.getByRole('heading', { name: 'Home', exact: true }).and(page.getByText('Home'))

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
  await expect(heading(page)).toBeVisible()

  await expect(page.getByText('Sent')).toBeVisible()
  await expect(page.getByText('0x93F2FA7A16a7365e3895b0F6E6Ac7a832d6c761a')).toBeVisible()
  await expect(page.getByText('10 USDC')).toBeVisible()

  // Button and label
  await expect(page.getByText('Deposit')).toHaveCount(2)

  await expect(page.getByText('/alice')).toBeVisible()
  await expect(page.getByText('Received')).toBeVisible()
  await expect(page.getByText('20 USDC')).toBeVisible()
  await expect(page.getByText('0xa71CE00000000000000000000000000000000000')).toBeVisible()
  await expect(page.getByText('30 USDC')).toBeVisible()
  await expect(page.getByText('0x93F2FA7A16a7365e3895b0F6E6Ac7a832d6c761a')).toBeVisible()

  expect(page.getByTestId('TokenDetailsHistory')).toBeVisible()
  // expect(await page.getByTestId('TokenDetailsHistory').textContent()).toMatchSnapshot(
  //   'token-details-history.txt'
  // )
  // await expect(page.getByTestId('TokenDetailsHistory')).toHaveScreenshot(
  //   'token-details-history.png',
  //   {
  //     timeout: 5_000,
  //   }
  // )
})
