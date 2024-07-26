import { faker } from '@faker-js/faker'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { userOnboarded, type SeedClient } from '@my/snaplet'
import type { Database } from '@my/supabase/database.types'
import { usdcAddress } from '@my/wagmi'
import type { Page } from '@playwright/test'
import { devices, mergeTests } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { price, pricing, reward, total } from 'app/data/sendtags'
import { fetchSendtagCheckoutReceipts } from 'app/features/account/sendtag/checkout/checkout-utils'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import debug from 'debug'
import { getAuthSessionFromContext } from './fixtures/auth'
import { test as checkoutTest, expect, type CheckoutPage } from './fixtures/checkout'
import type { ActivityMatch } from './fixtures/send-accounts/matchers/activity-feed'
import { lookupBalance, testBaseClient } from './fixtures/viem'

let log: debug.Debugger

const test = mergeTests(checkoutTest, snapletTest)

const debugAuthSession = async (page: Page) => {
  const { decoded } = await getAuthSessionFromContext(page.context())
  log('user authenticated', `id=${decoded.sub}`, `session=${decoded.session_id}`)
}

const pricingText = pricing.flatMap((p) => [p.length, p.price])

test.beforeEach(async ({ checkoutPage }) => {
  log = debug(`test:account-sendtag-checkout:logged-in:${test.info().parallelIndex}`)
  log('beforeEach', `url=${checkoutPage.page.url()}`)
  await debugAuthSession(checkoutPage.page)
})

const checkPricingTooltip = async (checkoutPage: CheckoutPage) => {
  await checkoutPage.openPricingTooltip()
  await expect(checkoutPage.pricingTooltip).toBeVisible()
  for (const text of pricingText) {
    await expect(checkoutPage.pricingTooltip).toContainText(text)
  }
}

const checkPricingDialog = async (checkoutPage: CheckoutPage) => {
  await checkoutPage.page.setViewportSize(devices['Pixel 5'].viewport)
  await checkoutPage.openPricingDialog()
  for (const text of pricingText) {
    await expect(checkoutPage.pricingDialog).toContainText(text)
  }
  await checkoutPage.pricingDialog.getByLabel('Dialog Close').click()
  await expect(checkoutPage.pricingDialog).toBeHidden()
}

const addPendingTag = async (checkoutPage: CheckoutPage, tagName: string) => {
  await checkoutPage.addPendingTag(tagName)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
}

const confirmTags = async (checkoutPage: CheckoutPage, tagNames: string[]) => {
  await checkoutPage.confirmTags(expect)
  for (const tagName of tagNames) {
    await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeHidden()
    await expect(checkoutPage.page.getByRole('heading', { name: tagName })).toBeVisible()
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

const setupReferral = async (
  seed: SeedClient
): Promise<{
  referrer: { referralCode: string; sendId: number }
  referrerSendAccount: { address: `0x${string}` }
  referrerTags: string[]
}> => {
  const plan = await seed.users([userOnboarded])
  const referrer = plan.profiles[0] as { referralCode: string; sendId: number }
  const referrerSendAccount = plan.sendAccounts[0] as { address: `0x${string}` }
  const referrerTags = plan.tags.map((t) => t.name)
  assert(!!referrer, 'profile not found')
  assert(!!referrer.referralCode, 'referral code not found')
  assert(!!referrerSendAccount, 'referrer send account not found')
  return { referrer, referrerSendAccount, referrerTags }
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

const generateTagName = () => faker.string.alphanumeric({ length: { min: 1, max: 20 } })

const checkReferralCodeVisibility = async (
  checkoutPage: CheckoutPage,
  referrer: { tags: string[]; referralCode: string }
) => {
  const refcode = checkoutPage.page.getByLabel('Referral Code:')
  const referredBy = checkoutPage.page.getByText(`/${referrer.tags[0]}`)
  await expect(refcode).toBeVisible()
  await expect(refcode).toHaveValue(referrer.referralCode)
  await expect(referredBy).toBeVisible()
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

test('can visit checkout page', async ({ page, checkoutPage }) => {
  await checkPricingTooltip(checkoutPage)
  await checkPricingDialog(checkoutPage)
})

test('can add a pending tag', async ({ checkoutPage }) => {
  const tagName = generateTagName()
  await addPendingTag(checkoutPage, tagName)
})

test('cannot add an invalid tag name', async ({ checkoutPage }) => {
  await checkoutPage.fillTagName('invalid tag!')
  await checkoutPage.submitTagButton.click()
  expect(checkoutPage.page.getByText('Only English alphabet, numbers, and underscore')).toBeTruthy()
})

test('can confirm a tag', async ({ checkoutPage, supabase, user: { profile: myProfile } }) => {
  const tagName = generateTagName()
  await addPendingTag(checkoutPage, tagName)
  await confirmTags(checkoutPage, [tagName])
  await verifyTagsInDatabase(supabase, [tagName])
  await expect(checkoutPage.page).toHaveTitle('Send | Sendtag')

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
  seed,
  checkoutPage,
  supabase,
  pg,
  user: { profile: myProfile },
}) => {
  const { referrer, referrerSendAccount, referrerTags } = await setupReferral(seed)
  await checkoutPage.page.goto(`/?referral=${referrer.referralCode}`)
  await checkoutPage.goto()

  const tagsToRegister = Array.from(
    { length: Math.floor(Math.random() * 5) + 1 },
    () => `${faker.lorem.word()}_${test.info().parallelIndex}`
  ).sort()
  for (const tagName of tagsToRegister) {
    await addPendingTag(checkoutPage, tagName)
  }

  // check referral code and referrer are visible
  const refcode = checkoutPage.page.getByLabel('Referral Code:')
  const referredBy = checkoutPage.page.getByText(`/${referrerTags[0]}`)
  await expect(refcode).toBeVisible()
  await expect(refcode).toHaveValue(referrer.referralCode)
  await expect(referredBy).toBeVisible() // show the referred
  // can change the referral code
  await refcode.fill('1234567890')
  await expect(referredBy).toBeHidden() // invalid code, no referral
  // can change the referrer to valid code
  await refcode.fill(referrer.referralCode)
  await expect(refcode).toBeVisible() // show the referral code
  await expect(referredBy).toBeVisible() // show the referred

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
      send_id: referrer.sendId,
      tags: referrerTags,
    },
    to_user: {
      id: myProfile.id,
      send_id: myProfile.send_id,
    },
    data: {
      tags: tagsToRegister,
    },
  })

  await verifyReferralReward(referrerSendAccount.address as `0x${string}`, tagsToRegister)
})

test('can refer multiple tags in separate transactions', async ({
  seed,
  checkoutPage,
  supabase,
  user: { profile: myProfile },
}) => {
  const { referrer, referrerSendAccount, referrerTags } = await setupReferral(seed)
  await checkoutPage.page.goto(`/?referral=${referrer.referralCode}`)
  await checkoutPage.goto()

  // First transaction with up to 2 tags
  const firstTags = Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () =>
    generateTagName()
  ).sort()
  for (const tagName of firstTags) {
    await addPendingTag(checkoutPage, tagName)
  }
  await checkReferralCodeVisibility(checkoutPage, {
    referralCode: referrer.referralCode,
    tags: referrerTags,
  })
  await confirmTags(checkoutPage, firstTags)
  await verifyTagsInDatabase(supabase, firstTags)
  await verifyCheckoutReceipt(supabase, firstTags, referrerSendAccount.address)
  await verifyActivityFeed(supabase, {
    event_name: 'referrals',
    from_user: {
      send_id: referrer.sendId,
      tags: referrerTags,
    },
    to_user: {
      id: myProfile.id,
      send_id: myProfile.send_id,
    },
    data: {
      tags: firstTags,
    },
  })
  await verifyReferralReward(referrerSendAccount.address as `0x${string}`, firstTags)

  // Second transaction
  await checkoutPage.goto() // Go back to the checkout page
  // Second transaction with up to 3 tags
  const secondTags = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
    generateTagName()
  ).sort()
  for (const tagName of secondTags) {
    await addPendingTag(checkoutPage, tagName)
  }
  await checkReferralCodeVisibility(checkoutPage, {
    referralCode: referrer.referralCode,
    tags: referrerTags,
  })
  // save current balance so we can verify the reward later
  const currentBalance = await lookupBalance({
    address: referrerSendAccount.address as `0x${string}`,
    token: usdcAddress[testBaseClient.chain.id],
  })
  await confirmTags(checkoutPage, secondTags)
  await verifyTagsInDatabase(supabase, [...firstTags, ...secondTags])
  await verifyCheckoutReceipt(supabase, secondTags, referrerSendAccount.address)
  await verifyActivityFeed(supabase, {
    event_name: 'referrals',
    from_user: {
      send_id: referrer.sendId,
      tags: referrerTags,
    },
    to_user: {
      id: myProfile.id,
      send_id: myProfile.send_id,
    },
    data: {
      tags: secondTags,
    },
  })
  await verifyReferralReward(
    referrerSendAccount.address as `0x${string}`,
    secondTags,
    currentBalance
  )
  log('done')
})

test('cannot confirm a tag without paying', async ({ checkoutPage, supabase }) => {
  const tagName = `${faker.lorem.word()}_${test.info().parallelIndex}`
  await checkoutPage.addPendingTag(tagName)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
  await checkoutPage.page.pause()
  const { data, error } = await supabase.rpc('confirm_tags', {
    tag_names: [tagName],
    event_id: '',
    referral_code_input: '',
  })
  log('cannot confirm a tag without paying', data, error)
  expect(error).toBeTruthy()
  expect(error?.code).toBe('42501')
  expect(error?.message).toBe('permission denied for function confirm_tags')
  expect(data).toBeFalsy()
})

test('cannot add more than 5 tags', async ({ checkoutPage, supabase }) => {
  const tagNames = Array.from({ length: 5 }, () => ({
    name: `${faker.lorem.word()}_${test.info().parallelIndex}`,
  }))
  await supabase
    .from('tags')
    .insert(tagNames)
    .then(({ error }) => {
      expect(error).toBeFalsy()
    })
  checkoutPage.page.reload()
  for (const { name } of tagNames) {
    await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${name}`)).toBeVisible()
  }
  await expect(checkoutPage.submitTagButton).toBeHidden()
  const { error } = await supabase.from('tags').insert({ name: faker.lorem.word() })
  expect(error).toBeTruthy()
  expect(error?.message).toBe('User can have at most 5 tags')
  expect(error?.code).toBe('P0001')
})
