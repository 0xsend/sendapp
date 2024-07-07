/**
 * Activity page is primiarly used for logged in users to find recent activity and also to search for users.
 */

import { SUPABASE_URL } from 'app/utils/supabase/admin'
import { expect, test } from './fixtures/send-accounts'
import debug from 'debug'
import type { Page } from '@playwright/test'
import { MockActivityFeed } from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import { userOnboarded } from '@my/snaplet/models'
import { assert } from 'app/utils/assert'

let log: debug.Debugger

test.beforeEach(() => {
  log = debug(`test:activity:logged-in:${test.info().parallelIndex}`)
})

const activityHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Activity', exact: true }).and(page.getByText('Activity'))

test('can visit activity page', async ({ page, pg, user: { profile }, seed }) => {
  log('visiting activity page')
  const plan = await seed.users([{ ...userOnboarded, tags: [] }]) // no tags
  const anotherUser = plan.profiles[0]
  assert(!!anotherUser, 'another user not found')
  const activities = MockActivityFeed.map((t) => ({
    event_name: t.event_name,
    event_id: crypto.randomUUID(),
    from_user_id: t.from_user?.id ? profile.id : null,
    to_user_id: t.to_user?.id ? profile.id : null,
    created_at: new Date(t.created_at).toISOString(),
    // biome-ignore lint/suspicious/noExplicitAny: mock
    data: t.data as any,
  }))
  // last send_account_transfers is received from another user
  const lastRow =
    activities[activities.findLastIndex((a) => a.event_name === 'send_account_transfers')]

  assert(!!lastRow, 'last row not found')
  lastRow.from_user_id = anotherUser.id
  for (const row of activities) {
    await pg.query(
      'insert into activity (event_name, event_id, from_user_id, to_user_id, created_at, data) values ($1, $2, $3, $4, $5, $6)',
      [row.event_name, row.event_id, row.from_user_id, row.to_user_id, row.created_at, row.data]
    )
  }
  const res = page.waitForResponse(`${SUPABASE_URL}/rest/v1/activity_feed*`)
  await page.goto('/activity')
  await res
  log('beforeEach', `url=${page.url()}`)
  await expect.soft(activityHeading(page)).toBeVisible()

  await expect.soft(page.getByText('Received').first()).toBeVisible()
  await expect.soft(page.getByText('0.019032 USDC').nth(1)).toBeVisible()
  await expect.soft(page.getByText('0xB2c21F54653531aa4AffA80F63593913f0C70628')).toBeVisible()

  await expect.soft(page.getByText('Sendtag Registered')).toBeVisible()
  await expect.soft(page.getByText('/yuw')).toBeVisible()
  await expect.soft(page.getByText('0.02 ETH').nth(1)).toBeVisible()

  await expect.soft(page.getByText('Referral', { exact: true })).toBeVisible()
  // await expect.soft(page.getByText('/disconnect_whorl7351')).toBeVisible()
  await expect.soft(page.getByText('1 Referrals').nth(1)).toBeVisible()

  await expect.soft(page.getByText('Send Account Signing Key Added').first()).toBeVisible()
  await expect.soft(page.getByText('Send Account Signing Key Removed')).toBeVisible()

  // await expect.soft(page.getByText('Sent')).toBeVisible()
  // await expect.soft(page.getByText('0.077777 USDC').nth(1)).toBeVisible()
  // await expect.soft(page.getByText('dan')).toBeVisible()

  await expect.soft(page.getByText('Received').nth(1)).toBeVisible()
  await expect.soft(page.getByText('0.01 ETH').nth(1)).toBeVisible()
  // await expect.soft(page.getByText(`#${anotherUser.sendId}`)).toBeVisible()
  await expect.soft(page.getByText('0x760E2928C3aa3aF87897bE52eb4833d42bbB27cf')).toBeVisible()

  await expect.soft(page.getByTestId('RecentActivity')).toBeVisible()
  // expect(await page.getByTestId('RecentActivity').textContent()).toMatchSnapshot(
  //   'recent-activity.txt'
  // )
  // await expect(page.getByTestId('RecentActivity')).toHaveScreenshot('recent-activity.png', {
  //   timeout: 5_000,
  // })
})

test('can search on activity page', async ({ page, context }) => {
  await page.goto('/activity')
  log('beforeEach', `url=${page.url()}`)
  const testTags = ['dob_spud89665', 'down_coke9222', 'few_down65006']

  // TODO: use snaplet snapshots so no need to mock supabase
  await context.route(`${SUPABASE_URL}/rest/v1/rpc/tag_search*`, async (route) => {
    expect(route.request().postDataJSON().query).toBe('test')
    await route.fulfill({
      body: JSON.stringify([
        {
          send_id_matches: null,
          tag_matches: testTags.map((t) => ({
            avatar_url: null,
            tag_name: t,
            send_id: Math.floor(Math.random() * 10000),
            phone: null,
          })),
          phone_matches: null,
        },
      ]),
      headers: { 'content-type': 'application/json; charset=utf-8' },
      status: 200,
    })
  })
  await expect(activityHeading(page)).toBeVisible()
  const isLoading = page.getByRole('progressbar', { name: 'Loading' })
  const searchInput = page.getByPlaceholder('Sendtag, Phone, Send ID')
  await searchInput.fill('test')
  await expect(searchInput).toHaveValue('test')
  await page.waitForResponse(`${SUPABASE_URL}/rest/v1/rpc/tag_search*`)
  await isLoading.waitFor({ state: 'detached' })
  await expect(page.getByRole('heading', { name: 'TAG' })).toBeVisible()
  for (const tag of testTags) {
    await expect(page.getByRole('link', { name: `${tag} /${tag}` })).toBeVisible()
  }
})
