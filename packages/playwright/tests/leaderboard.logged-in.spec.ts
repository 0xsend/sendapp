import { leaderboardReferralsAllTimes, userOnboarded } from '@my/snaplet/models'
import { expect, test } from './fixtures/send-accounts'
import debug from 'debug'

let log: debug.Debugger

test.beforeEach(async ({ page, user: { user }, seed }) => {
  log = debug(`test:leaderboard:logged-in:${user.id}:${test.info().parallelIndex}`)
})

test('can visit leaderboard page', async ({ page, seed, user: { user } }) => {
  await seed.users([
    {
      ...userOnboarded,
      leaderboard_referrals_all_time: [leaderboardReferralsAllTimes],
    },
  ])

  await page.goto('/leaderboard')
  await page.waitForURL('/leaderboard')
  await expect(page).toHaveURL('/leaderboard')

  await expect(page.getByText('Best in class')).toBeVisible()
  await expect(page.getByTestId('titleReferrals')).toBeVisible()
  await expect(page.getByText('Sendtag', { exact: true })).toBeVisible()
  // await expect(page.getByTestId('titleTransactions')).toBeVisible()
})
