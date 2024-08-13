import { expect, test } from './fixtures/send-accounts'
import debug from 'debug'

let log: debug.Debugger

test.beforeEach(async ({ page, user: { user } }) => {
  log = debug(`test:leaderboard:logged-in:${user.id}:${test.info().parallelIndex}`)
  await page.goto('/leaderboard')
  await page.waitForURL('/leaderboard')
})

test('can visit leaderboard page', async ({ page }) => {
  await expect(page).toHaveURL('/leaderboard')

  await expect(page.getByText('Best in class')).toBeVisible()
  await expect(page.getByTestId('titleReferrals')).toBeVisible()
  await expect(page.getByTestId('titleTransactions')).toBeVisible()

  const elements = page.locator('text=Sendtag')
  await expect(elements).toHaveCount(3)
})
