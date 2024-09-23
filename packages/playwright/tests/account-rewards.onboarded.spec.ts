import debug from 'debug'
import { expect, test } from './fixtures/send-accounts'

let log: debug.Debugger

test.beforeEach(async ({ page }) => {
  log = debug(`test:account-rewards:logged-in:${test.info().parallelIndex}`)
  log('beforeEach', `url=${page.url()}`)
  // TODO: Make user eligible for account-rewards
})

test('can visit rewards page', async ({ page }) => {
  await page.goto('/account/rewards')
  await expect(page).toHaveURL('/account/rewards')
  await expect(page.getByText('Rewards', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Claim Your Network Benefits' })).toBeVisible()
})
