import { SUPABASE_URL } from 'app/utils/supabase/admin'
import { expect, test } from './fixtures/send-accounts'
import debug from 'debug'
import type { Page } from '@playwright/test'
import { MockActivityFeed } from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import { userOnboarded } from '@my/snaplet'
import { assert } from 'app/utils/assert'
import { sendtagCheckoutAddress, testBaseClient, usdcAddress } from './fixtures/viem'
import { zeroAddress } from 'viem'

let log: debug.Debugger

test.beforeEach(() => {
  log = debug(`test:activity:logged-in:${test.info().parallelIndex}`)
})

const activityHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Activity', exact: true }).and(page.getByText('Activity'))

test('can visit activity page and see correct activity feed', async ({
  page,
  pg,
  user: { profile },
  seed,
}) => {
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

  // Add a sendtag referral reward USDC
  activities.push({
    event_name: 'send_account_transfers',
    event_id: crypto.randomUUID(),
    from_user_id: null,
    to_user_id: profile.id,
    created_at: new Date().toISOString(),
    data: {
      log_addr: usdcAddress[testBaseClient.chain.id],
      f: sendtagCheckoutAddress[testBaseClient.chain.id],
      t: zeroAddress,
      v: 1000000n,
    },
  })

  // Set the last send_account_transfers to be received from another user
  const lastRow =
    activities[activities.findLastIndex((a) => a.event_name === 'send_account_transfers')]
  assert(!!lastRow, 'last row not found')
  lastRow.from_user_id = anotherUser.id

  // Insert activities into the database
  for (const row of activities) {
    await pg.query(
      'insert into activity (event_name, event_id, from_user_id, to_user_id, created_at, data) values ($1, $2, $3, $4, $5, $6)',
      [row.event_name, row.event_id, row.from_user_id, row.to_user_id, row.created_at, row.data]
    )
  }

  // Wait for the activity feed response
  const res = page.waitForResponse(async (res) => {
    if (res.url().match(`${SUPABASE_URL}/rest/v1/activity_feed*`)) {
      expect(res.status()).toBe(200)
      const json = await res.json()
      log('activity feed', json)
      return true
    }
    return false
  })

  await page.goto('/activity')
  await res
  log('beforeEach', `url=${page.url()}`)

  // Verify the activity heading
  await expect(activityHeading(page)).toBeVisible()

  // Verify each row of the activity feed
  const activityRows = page.getByTestId('ActivityRow')

  // Row 1: Deposit
  await expect(activityRows.nth(0)).toContainText('Deposit')
  await expect(activityRows.nth(0)).toContainText('0.019032 USDC')
  await expect(activityRows.nth(0)).toContainText('0xB2c21F54653531aa4AffA80F63593913f0C70628')

  // Row 2: Sendtag Registered (ETH)
  await expect(activityRows.nth(1)).toContainText('Sendtag Registered')
  await expect(activityRows.nth(1)).toContainText('/yuw')
  await expect(activityRows.nth(1)).toContainText('0.02 ETH')

  // Row 3: Sendtag Registered (USDC)
  await expect(activityRows.nth(2)).toContainText('Sendtag Registered')
  await expect(activityRows.nth(2)).toContainText('/tag_receipt_usdc')
  await expect(activityRows.nth(2)).toContainText('2 USDC')

  // Row 4: Referral
  await expect(activityRows.nth(3)).toContainText('Referral')
  await expect(activityRows.nth(3)).toContainText('1 Referrals')

  // Row 5: Send Account Signing Key Added
  await expect(activityRows.nth(4)).toContainText('Send Account Signing Key Added')

  // Row 6: Send Account Signing Key Removed
  await expect(activityRows.nth(5)).toContainText('Send Account Signing Key Removed')

  // Row 7: Deposit (ETH)
  await expect(activityRows.nth(6)).toContainText('Deposit')
  await expect(activityRows.nth(6)).toContainText('0.01 ETH')
  await expect(activityRows.nth(6)).toContainText('0x760E2928C3aa3aF87897bE52eb4833d42bbB27cf')

  // Row 8: Referral Reward
  await expect(activityRows.nth(7)).toContainText('Referral Reward')
  await expect(activityRows.nth(7)).toContainText('1 USDC')

  // Verify the entire Recent Activity component is visible
  await expect(page.getByTestId('RecentActivity')).toBeVisible()
})

test('can search on activity page', async ({ page, context }) => {
  await page.goto('/activity')
  log('beforeEach', `url=${page.url()}`)
  const testTags = ['dob_spud89665', 'down_coke9222', 'few_down65006']

  // Mock the tag search response
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

  // Verify the activity heading is visible
  await expect(activityHeading(page)).toBeVisible()

  // Perform the search
  const isLoading = page.getByRole('progressbar', { name: 'Loading' })
  const searchInput = page.getByPlaceholder('Sendtag, Phone, Send ID, Address')
  await searchInput.fill('test')
  await expect(searchInput).toHaveValue('test')

  // Wait for the search response and loading to complete
  await page.waitForResponse(`${SUPABASE_URL}/rest/v1/rpc/tag_search*`)
  await isLoading.waitFor({ state: 'detached' })

  // Verify search results
  await expect(page.getByRole('heading', { name: 'TAG' })).toBeVisible()
  for (const tag of testTags) {
    await expect(page.getByRole('link', { name: `${tag} /${tag}` })).toBeVisible()
  }
})
