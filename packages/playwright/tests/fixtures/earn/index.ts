import { test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { mergeTests, type Page } from '@playwright/test'
import debug from 'debug'
import { EarnClaimPage } from './EarnClaimPage'
import { EarnDepositPage } from './EarnDepositPage'
import { EarnWithdrawPage } from './EarnWithdrawPage'

/**
 * Helper function to navigate directly to the main /earn page.
 * @param page Playwright Page object
 */
export async function navigateToEarnPage(page: Page) {
  log('Navigating to /earn')
  await page.goto('/earn')
  await page.waitForURL('/earn')
  log('Successfully navigated to /earn')
}

const baseTest = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

export const test = baseTest.extend<{
  earnDepositPage: EarnDepositPage
  earnWithdrawPage: EarnWithdrawPage
  earnClaimPage: EarnClaimPage
}>({
  earnDepositPage: async ({ page }, use) => {
    log = debug(`test:earn:deposit:${test.info().parallelIndex}`)
    log('creating sendEarnDepositPage')
    const sendEarnDepositPage = new EarnDepositPage(page)
    await use(sendEarnDepositPage)
  },
  earnWithdrawPage: async ({ page }, use) => {
    log = debug(`test:earn:withdraw:${test.info().parallelIndex}`)
    log('creating sendEarnWithdrawPage')
    const sendEarnWithdrawPage = new EarnWithdrawPage(page)
    await use(sendEarnWithdrawPage)
  },
  earnClaimPage: async ({ page }, use) => {
    log = debug(`test:earn:claim:${test.info().parallelIndex}`)
    log('creating sendEarnClaimPage')
    const sendEarnClaimPage = new EarnClaimPage(page)
    await use(sendEarnClaimPage)
  },
})

export const expect = test.expect

/**
 * @dev copy-pasted from 'app/features/earn/params.ts' since playwright can't handle importing solito correctly
 */
export function coinToParam(coin: { symbol: string }): string {
  return coin.symbol.toLowerCase()
}

export { EarnClaimPage, EarnDepositPage, EarnWithdrawPage }
