import { userOnboarded } from '@my/snaplet'
import { sendtagCheckoutAddress, usdcAddress } from '@my/wagmi'
import type { Page } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { SUPABASE_URL } from 'app/utils/supabase/admin'
import debug from 'debug'
import crypto from 'node:crypto'
import { zeroAddress } from 'viem'
import { expect, test } from './fixtures/send-accounts'
import { testBaseClient } from './fixtures/viem'
import { shorten } from 'app/utils/strings'

let log: debug.Debugger

const fakeOnchainEventData = (data) => ({
  tx_hash: hexToBytea(`0x${crypto.randomBytes(32).toString('hex')}`),
  block_num: BigInt(Math.floor(Math.random() * 10000)).toString(),
  tx_idx: BigInt(Math.floor(Math.random() * 10000)).toString(),
  log_idx: BigInt(Math.floor(Math.random() * 10000)).toString(),
  ...data,
})

test.beforeEach(() => {
  log = debug(`test:activity:logged-in:${test.info().parallelIndex}`)
})

// @todo: Heading checks need to be refactored to mobile only
// const activityHeading = (page: Page) =>
//   page.getByRole('heading', { name: 'Activity', exact: true }).and(page.getByText('Activity'))

test('can visit activity page and see correct activity feed', async ({
  page,
  pg,
  user: { profile },
  sendAccount,
  seed,
}) => {
  const plan = await seed.users([
    { ...userOnboarded, tags: [] }, // no tags
    userOnboarded,
  ])
  const anotherUser = plan.profiles[0]
  const anotherSendAccount = plan.send_accounts[0]
  const thirdUser = plan.profiles[1]
  const thirdSendAccount = plan.send_accounts[1]
  const thirdTag = plan.tags[0]

  assert(!!anotherUser, 'another user not found')
  assert(!!anotherSendAccount, 'another send account not found')
  assert(!!thirdUser, 'third user not found')
  assert(!!thirdSendAccount, 'third send account not found')
  assert(!!thirdTag, 'third tag not found')
  const now = new Date()
  const dateFromNow = (secs: number) => new Date(now.getTime() + secs * 1000)
  const activities = [
    // Deposit (receive from unknown)
    {
      event_name: 'send_account_transfers',
      event_id: crypto.randomUUID(),
      from_user_id: null,
      to_user_id: profile.id,
      created_at: dateFromNow(1).toISOString(),
      data: fakeOnchainEventData({
        log_addr: hexToBytea(usdcAddress[testBaseClient.chain.id]),
        f: hexToBytea(anotherSendAccount.address as `0x${string}`),
        t: hexToBytea(sendAccount.address as `0x${string}`),
        v: '19032',
      }),
    },
    // Send to another user
    {
      event_name: 'send_account_transfers',
      event_id: crypto.randomUUID(),
      from_user_id: profile.id,
      to_user_id: anotherUser.id,
      created_at: dateFromNow(2).toISOString(),
      data: fakeOnchainEventData({
        log_addr: hexToBytea(usdcAddress[testBaseClient.chain.id]),
        f: hexToBytea(sendAccount.address as `0x${string}`),
        t: hexToBytea(anotherSendAccount.address as `0x${string}`),
        v: '77777',
      }),
    },
    // Receive from another user
    {
      event_name: 'send_account_transfers',
      event_id: crypto.randomUUID(),
      from_user_id: thirdUser.id,
      to_user_id: profile.id,
      created_at: dateFromNow(3).toISOString(),
      data: fakeOnchainEventData({
        log_addr: hexToBytea(usdcAddress[testBaseClient.chain.id]),
        f: hexToBytea(thirdSendAccount.address as `0x${string}`),
        t: hexToBytea(sendAccount.address as `0x${string}`),
        v: '50000',
      }),
    },
    // Tag receipt (ETH)
    {
      event_name: 'tag_receipts',
      event_id: crypto.randomUUID(),
      from_user_id: profile.id,
      to_user_id: null,
      created_at: dateFromNow(4).toISOString(),
      data: fakeOnchainEventData({
        tags: ['newtag'],
        value: '20000000000000000',
        log_addr: hexToBytea(zeroAddress),
      }),
    },
    // Tag receipt (USDC)
    {
      event_name: 'tag_receipt_usdc',
      event_id: crypto.randomUUID(),
      from_user_id: profile.id,
      to_user_id: null,
      created_at: dateFromNow(5).toISOString(),
      data: fakeOnchainEventData({
        tags: ['usdctag'],
        value: '2000000',
        log_addr: hexToBytea(usdcAddress[testBaseClient.chain.id]),
      }),
    },
    // Referral (as referrer)
    {
      event_name: 'referrals',
      event_id: crypto.randomUUID(),
      from_user_id: profile.id,
      to_user_id: anotherUser.id,
      created_at: dateFromNow(6).toISOString(),
      data: {
        tags: [thirdTag.name],
      },
    },
    // Referral (as referred)
    {
      event_name: 'referrals',
      event_id: crypto.randomUUID(),
      from_user_id: thirdUser.id,
      to_user_id: profile.id,
      created_at: dateFromNow(7).toISOString(),
      data: {
        tags: [thirdTag.name],
      },
    },
    // Signing key added
    {
      event_name: 'send_account_signing_key_added',
      event_id: crypto.randomUUID(),
      from_user_id: profile.id,
      to_user_id: null,
      created_at: dateFromNow(8).toISOString(),
      data: fakeOnchainEventData({
        key: ['0x1234', '0x5678'],
        account: hexToBytea(sendAccount.address as `0x${string}`),
        key_slot: 0,
      }),
    },
    // Signing key removed
    {
      event_name: 'send_account_signing_key_removed',
      event_id: crypto.randomUUID(),
      from_user_id: profile.id,
      to_user_id: null,
      created_at: dateFromNow(9).toISOString(),
      data: fakeOnchainEventData({
        key: ['0x1234', '0x5678'],
        account: hexToBytea(sendAccount.address as `0x${string}`),
        key_slot: 0,
      }),
    },
    // Referral reward
    {
      event_name: 'send_account_transfers',
      event_id: crypto.randomUUID(),
      from_user_id: null,
      to_user_id: profile.id,
      created_at: dateFromNow(10).toISOString(),
      data: fakeOnchainEventData({
        log_addr: hexToBytea(usdcAddress[testBaseClient.chain.id]),
        f: hexToBytea(sendtagCheckoutAddress[testBaseClient.chain.id] as `0x${string}`),
        t: hexToBytea(sendAccount.address as `0x${string}`),
        v: '1000000',
      }),
    },
  ]

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
      // const data = await res.json()
      // log('activity feed response', data)
      return true
    }
    return false
  })

  await page.goto('/activity')
  await res

  // Verify the activity heading
  // @todo: Heading checks need to be refactored to mobile only
  // await expect(activityHeading(page)).toBeVisible()

  // Verify the entire Recent Activity component is visible
  await expect(page.getByTestId('RecentActivity')).toBeVisible()
  const loadMoreButton = page.getByRole('button', { name: 'Load More' })
  await expect(loadMoreButton).toBeVisible()
  await loadMoreButton.click() // load everything
  await expect(loadMoreButton).toBeHidden()

  // Verify each row of the activity feed
  const activityRows = page.getByTestId('ActivityRow')
  expect.soft(await activityRows.count()).toBeGreaterThanOrEqual(10)

  // Referral reward
  await expect.soft(activityRows.nth(0)).toContainText('Referral Reward')
  await expect.soft(activityRows.nth(0)).toContainText('1 USDC')
  await expect.soft(activityRows.nth(0)).toContainText('Sendtag Checkout')

  // Signing key removed
  await expect.soft(activityRows.nth(1)).toContainText('Send Account Signing Key Removed')

  // Signing key added
  await expect.soft(activityRows.nth(2)).toContainText('Send Account Signing Key Added')

  // Referral (as referred)
  await expect.soft(activityRows.nth(3)).toContainText('Referred By')
  await expect.soft(activityRows.nth(3)).toContainText(thirdTag.name)

  // Referral (as referrer)
  await expect.soft(activityRows.nth(4)).toContainText('Referral')
  await expect.soft(activityRows.nth(4)).toContainText('1 Referrals')
  await expect.soft(activityRows.nth(4)).toContainText(anotherUser.name ?? '')

  // Tag receipt (USDC)
  await expect.soft(activityRows.nth(5)).toContainText('Sendtag Registered')
  await expect.soft(activityRows.nth(5)).toContainText('/usdctag')
  await expect.soft(activityRows.nth(5)).toContainText('2 USDC')

  // Tag receipt (ETH)
  await expect.soft(activityRows.nth(6)).toContainText('Sendtag Registered')
  await expect.soft(activityRows.nth(6)).toContainText('/newtag')
  await expect.soft(activityRows.nth(6)).toContainText('0.02 ETH')

  // Receive
  await expect.soft(activityRows.nth(7)).toContainText('Received')
  await expect.soft(activityRows.nth(7)).toContainText('0.05 USDC')
  await expect.soft(activityRows.nth(7)).toContainText(thirdTag.name)

  // Send
  await expect.soft(activityRows.nth(8)).toContainText('Sent')
  await expect.soft(activityRows.nth(8)).toContainText('0.077777 USDC')
  await expect.soft(activityRows.nth(8)).toContainText(anotherUser.name ?? '')

  // Deposit
  await expect.soft(activityRows.nth(9)).toContainText('Deposit')
  await expect.soft(activityRows.nth(9)).toContainText('0.019032 USDC')
  await expect.soft(activityRows.nth(9)).toContainText(shorten(anotherSendAccount.address, 5, 4))
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
  // @todo: Heading checks need to be refactored to mobile only
  // await expect(activityHeading(page)).toBeVisible()

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
