import { faker } from '@faker-js/faker'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { type SeedClient, createUserWithTagsAndAccounts } from '@my/snaplet'
import type { Database } from '@my/supabase/database.types'
import { usdcAddress } from '@my/wagmi'
import { mergeTests, type Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { price, reward, total } from 'app/data/sendtags'
import { fetchSendtagCheckoutReceipts } from 'app/features/account/sendtag/checkout/checkout-utils.fetchSendtagCheckoutReceipts'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import debug from 'debug'
import { getAuthSessionFromContext } from './fixtures/auth'
import { checkReferralCodeVisibility } from './fixtures/referrals'
import type { ActivityMatch } from './fixtures/send-accounts/matchers/activity-feed'
import { type CheckoutPage, test as checkoutTest, expect } from './fixtures/sendtags/checkout'
import { lookupBalance, testBaseClient } from './fixtures/viem'

let log: debug.Debugger

const test = mergeTests(checkoutTest, snapletTest)

const debugAuthSession = async (page: Page) => {
  const { decoded } = await getAuthSessionFromContext(page.context())
  log('user authenticated', `id=${decoded.sub}`, `session=${decoded.session_id}`)
}

test.beforeEach(async ({ checkoutPage }) => {
  log = debug(`test:account-sendtag-checkout:logged-in:${test.info().parallelIndex}`)
  log('beforeEach', `url=${checkoutPage.page.url()}`)
  await debugAuthSession(checkoutPage.page)
})

const addPendingTags = async (supabase: SupabaseClient<Database>, tagNames: string[]) => {
  // Get the user's send account first
  const { data: sendAccount, error: sendAccountError } = await supabase
    .from('send_accounts')
    .select('id')
    .single()

  expect(sendAccountError).toBeFalsy()
  expect(sendAccount).toBeTruthy()
  assert(!!sendAccount?.id, 'Send account id should be defined')

  // Check current tag count
  const { data: currentTags } = await supabase
    .from('send_account_tags')
    .select('tag_id')
    .eq('send_account_id', sendAccount.id)

  const currentTagCount = currentTags?.length || 0
  const totalTagsAfterAdd = currentTagCount + tagNames.length

  if (totalTagsAfterAdd > 5) {
    throw new Error(
      `Cannot add ${tagNames.length} tags. User already has ${currentTagCount} tags, and limit is 5.`
    )
  }

  // Create each tag using RPC
  for (const tagName of tagNames) {
    const { error } = await supabase.rpc('create_tag', {
      tag_name: tagName,
      send_account_id: sendAccount?.id,
    })
    expect(error).toBeFalsy()
  }
}

const confirmTags = async (checkoutPage: CheckoutPage, tagNames: string[]) => {
  await checkoutPage.confirmTags(expect)
  for (const tagName of tagNames) {
    await expect(checkoutPage.page.getByTestId(`confirmed-tag-${tagName}`)).toBeVisible()
  }
}

const verifyTagsInDatabase = async (supabase: SupabaseClient<Database>, tagNames: string[]) => {
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .in('name', tagNames)
    .eq('status', 'confirmed')
  expect(error).toBeFalsy()
  expect(tags).toHaveLength(tagNames.length)
  return tags
}

const verifyActivityFeed = async (supabase: SupabaseClient<Database>, event: ActivityMatch) => {
  await expect(supabase).toHaveEventInActivityFeed(event)
}

const verifyReferralReward = async (
  referrerAddress: `0x${string}`,
  tagsToRegister: string[],
  currentBalance?: bigint
) => {
  const referrerBalance = await lookupBalance({
    address: referrerAddress,
    token: usdcAddress[testBaseClient.chain.id],
  })
  const rewardAmount = tagsToRegister.reduce((acc, tag) => acc + reward(tag.length), 0n)
  expect(referrerBalance - (currentBalance ?? 0n)).toBe(rewardAmount)
  return rewardAmount
}

// tag names are limited to 1-20 characters
const generateTagName = () => faker.string.alphanumeric({ length: { min: 6, max: 20 } })

const checkReferralCodeDisabled = async (checkoutPage: CheckoutPage) => {
  const refcode = checkoutPage.page.getByTestId('referral-code-input')
  await expect(refcode).toBeDisabled()
}

const verifyCheckoutReceipt = async (
  supabase: SupabaseClient<Database>,
  tagsToRegister: string[],
  referrerAddress: string
) => {
  const { data: checkoutReceipt, error: checkoutReceiptError } = await fetchSendtagCheckoutReceipts(
    supabase
  )
    .order('block_num', { ascending: false })
    .limit(1)
    .single()

  expect(checkoutReceiptError).toBeFalsy()
  expect(checkoutReceipt).toBeTruthy()
  assert(!!checkoutReceipt?.event_id, 'checkout receipt event id not found')
  expect(BigInt(checkoutReceipt?.amount)).toBe(total(tagsToRegister.map((t) => ({ name: t }))))
  expect(checkoutReceipt?.referrer).toBe(hexToBytea(referrerAddress as `0x${string}`))
  expect(BigInt(checkoutReceipt?.reward)).toBe(
    tagsToRegister.reduce((acc, tag) => acc + reward(tag.length), 0n)
  )

  const { data: receipts, error: receiptError } = await supabase
    .from('receipts')
    .select('*')
    .eq('event_id', checkoutReceipt.event_id)
    .single()

  expect(receiptError).toBeFalsy()
  expect(receipts).toBeTruthy()
}

test('can confirm a tag', async ({ checkoutPage, supabase, user: { profile: myProfile } }) => {
  const tagName = generateTagName()
  await addPendingTags(supabase, [tagName])
  await checkoutPage.goto()
  await confirmTags(checkoutPage, [tagName])
  await verifyTagsInDatabase(supabase, [tagName])
  await expect(checkoutPage.page).toHaveTitle('Send | Sendtags')

  const receiptEvent = {
    event_name: 'tag_receipt_usdc',
    from_user: {
      id: myProfile.id,
      send_id: myProfile.send_id,
    },
    data: {
      tags: [tagName],
      value: price(tagName.length).toString(),
    },
  }
  await verifyActivityFeed(supabase, receiptEvent)
})

test('can refer a tag', async ({
  checkoutPage,
  supabase,
  user: { profile: myProfile },
  referrer: ref,
}) => {
  const { referrer, referrerSendAccount, referrerTags } = ref

  const tagsToRegister = Array.from(
    { length: Math.floor(Math.random() * 5) + 1 },
    () => `${faker.lorem.word()}_${test.info().parallelIndex}`
  ).sort((a, b) => a.localeCompare(b))

  await addPendingTags(supabase, tagsToRegister)
  await checkoutPage.page.goto(`/?referral=${referrer.referral_code}`)
  await checkoutPage.goto()

  // check referral code and referrer are visible
  const refcode = checkoutPage.page.getByTestId('referral-code-input')
  await checkReferralCodeVisibility({
    page: checkoutPage.page,
    referralCode: referrerTags[0] ?? referrer.referral_code,
  })
  // can change the referral code
  await refcode.fill('1234567890')
  const referralCodeInvalid = checkoutPage.page.getByText('Invalid referral code')
  await expect(referralCodeInvalid).toBeVisible()
  // can change the referrer to valid code
  await refcode.fill(referrer.referral_code)
  await checkReferralCodeVisibility({
    page: checkoutPage.page,
    referralCode: referrer.referral_code,
  })

  await confirmTags(checkoutPage, tagsToRegister)
  await verifyTagsInDatabase(supabase, tagsToRegister)

  // ensure receipts are created
  const { data: checkoutReceipt, error: checkoutReceiptError } =
    await fetchSendtagCheckoutReceipts(supabase).single()

  expect(checkoutReceiptError).toBeFalsy()
  expect(checkoutReceipt).toBeTruthy()
  assert(!!checkoutReceipt?.event_id, 'checkout receipt event id not found')
  expect(BigInt(checkoutReceipt?.amount)).toBe(total(tagsToRegister.map((t) => ({ name: t }))))
  expect(checkoutReceipt?.referrer).toBe(hexToBytea(referrerSendAccount.address as `0x${string}`))
  expect(BigInt(checkoutReceipt?.reward)).toBe(
    tagsToRegister.reduce((acc, tag) => acc + reward(tag.length), 0n)
  )
  const { data: receipts, error: receiptError } = await supabase
    .from('receipts')
    .select('*')
    .eq('event_id', checkoutReceipt.event_id)
    .single()

  log('receipts', receipts)

  expect(receiptError).toBeFalsy()
  expect(receipts).toBeTruthy()

  await verifyActivityFeed(supabase, {
    event_name: 'referrals',
    from_user: {
      send_id: referrer.send_id,
      tags: referrerTags,
    },
    to_user: {
      id: myProfile.id,
      send_id: myProfile.send_id,
    },
    data: {
      tags: expect.arrayContaining([tagsToRegister[0]]),
    },
  })

  await verifyReferralReward(referrerSendAccount.address as `0x${string}`, tagsToRegister)
})

test('can refer multiple tags in separate transactions', async ({
  checkoutPage,
  supabase,
  user: { profile: myProfile },
  referrer: ref,
}) => {
  test.setTimeout(45_000)
  // First transaction with up to 2 tags
  const firstTags = Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () =>
    generateTagName()
  ).sort((a, b) => a.localeCompare(b))

  await addPendingTags(supabase, firstTags)

  const { referrer, referrerSendAccount, referrerTags } = ref
  await checkoutPage.page.goto(`/?referral=${referrer.referral_code}`)
  await checkoutPage.goto()

  await checkReferralCodeVisibility({
    page: checkoutPage.page,
    referralCode: referrerTags[0] ?? referrer.referral_code,
  })
  await confirmTags(checkoutPage, firstTags)
  await verifyTagsInDatabase(supabase, firstTags)
  await verifyCheckoutReceipt(supabase, firstTags, referrerSendAccount.address)
  await expect(supabase).toHaveEventInActivityFeed({
    event_name: 'referrals',
    from_user: {
      send_id: referrer.send_id,
      tags: referrerTags,
    },
    to_user: {
      id: myProfile.id,
      send_id: myProfile.send_id,
    },
    data: {
      tags: expect.arrayContaining([firstTags[0]]),
    },
  })
  const firstRewardAmount = await verifyReferralReward(
    referrerSendAccount.address as `0x${string}`,
    firstTags
  )

  // Second transaction with up to 2 tags
  const secondTags = Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () =>
    generateTagName()
  ).sort((a, b) => a.localeCompare(b))

  await addPendingTags(supabase, secondTags)

  await checkoutPage.page.goto(`/?referral=${referrer.referral_code}`)
  await checkoutPage.goto()

  await checkReferralCodeDisabled(checkoutPage)
  // save current balance so we can verify the reward later
  const currentBalance = await lookupBalance({
    address: referrerSendAccount.address as `0x${string}`,
    token: usdcAddress[testBaseClient.chain.id],
  })
  await confirmTags(checkoutPage, secondTags)
  await verifyTagsInDatabase(supabase, [...firstTags, ...secondTags])
  await verifyCheckoutReceipt(supabase, secondTags, referrerSendAccount.address)
  const secondRewardAmount = await verifyReferralReward(
    referrerSendAccount.address as `0x${string}`,
    secondTags,
    currentBalance
  )

  // peek at the leaderboard
  const { data: leaderboardData, error: leaderboardError } = await supabase
    .rpc('leaderboard_referrals_all_time')
    .eq('user ->> send_id', referrer.send_id.toString())
    .select('rewards_usdc::text,referrals::text,user')
  expect(leaderboardError).toBeFalsy()
  expect(leaderboardData?.[0]).toBeTruthy()
  assert(!!leaderboardData?.[0], 'leaderboard data not found')
  expect(leaderboardData[0].rewards_usdc).toBe((firstRewardAmount + secondRewardAmount).toString())
  expect(leaderboardData[0].referrals).toBe((1).toString())
  log('leaderboard', leaderboardData)

  log('done')
})
