import { faker } from '@faker-js/faker'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { userOnboarded } from '@my/snaplet/models'
import type { Page } from '@playwright/test'
import { devices, mergeTests } from '@playwright/test'
import { assert } from 'app/utils/assert'
import debug from 'debug'
import { parseEther } from 'viem'
import { getAuthSessionFromContext } from './fixtures/auth'
import { test as checkoutTest, expect } from './fixtures/checkout'
import { pricing, price } from 'app/data/sendtags'

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

test('can visit checkout page', async ({ page, checkoutPage }) => {
  await checkoutPage.openPricingTooltip()
  await expect(checkoutPage.pricingTooltip).toBeVisible()
  for (const text of pricingText) {
    await expect(checkoutPage.pricingTooltip).toContainText(text)
  }
  // check pricing dialog
  await page.setViewportSize(devices['Pixel 5'].viewport)
  await checkoutPage.openPricingDialog()
  for (const text of pricingText) {
    await expect(checkoutPage.pricingDialog).toContainText(text)
  }
  await checkoutPage.pricingDialog.getByLabel('Dialog Close').click()
  await expect(checkoutPage.pricingDialog).toBeHidden()
})

test('can add a pending tag', async ({ checkoutPage }) => {
  const tagName = `${faker.lorem.word({
    length: { min: 1, max: 16 },
  })}_${test.info().parallelIndex}`
  await checkoutPage.addPendingTag(tagName)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
})

test('cannot add an invalid tag name', async ({ checkoutPage }) => {
  await checkoutPage.fillTagName('invalid tag!')
  await checkoutPage.submitTagButton.click()
  // Assuming there's an error message displayed for invalid tags
  expect(checkoutPage.page.getByText('Only English alphabet, numbers, and underscore')).toBeTruthy()
})

test('can confirm a tag', async ({ checkoutPage, supabase, user: { profile: myProfile } }) => {
  // test.setTimeout(60_000) // 60 seconds
  const tagName = faker.string.alphanumeric({ length: { min: 1, max: 20 } })
  await checkoutPage.addPendingTag(tagName)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
  await checkoutPage.confirmTags(expect)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeHidden()

  const { data: tags, error } = await supabase.from('tags').select('*').eq('name', tagName)
  expect(error).toBeFalsy()
  expect(tags).toHaveLength(1)

  await expect(checkoutPage.page).toHaveTitle('Send | Sendtag')
  await expect(checkoutPage.page.getByRole('heading', { name: tagName })).toBeVisible()

  const { data, error: activityError } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('event_name', 'tag_receipt_usdc')
  expect(activityError).toBeFalsy()
  expect(data).toHaveLength(1)
  expect((data?.[0]?.data as { tags: string[] })?.tags).toEqual([tagName])

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
  await expect(supabase).toHaveEventInActivityFeed(receiptEvent)
})

test('can refer a tag', async ({
  seed,
  checkoutPage,
  supabase,
  pg,
  user: { profile: myProfile },
}) => {
  const plan = await seed.users([userOnboarded])
  const referrer = plan.profiles[0]
  const referrerTags = plan.tags.map((t) => t.name)
  assert(!!referrer, 'profile not found')
  assert(!!referrer.referralCode, 'referral code not found')
  await checkoutPage.page.goto(`/?referral=${referrer.referralCode}`)
  await checkoutPage.goto()
  const tagsCount = Math.floor(Math.random() * 5) + 1
  const tagsToRegister: string[] = []
  for (let i = 0; i < tagsCount; i++) {
    const tagName = `${faker.lorem.word()}_${test.info().parallelIndex}`
    tagsToRegister.push(tagName)
    await checkoutPage.addPendingTag(tagName)
    await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
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

  await checkoutPage.confirmTags(expect)
  const { data: tags, error } = await supabase.from('tags').select('*').in('name', tagsToRegister)
  expect(error).toBeFalsy()
  expect(tags).toHaveLength(tagsCount)

  await expect(checkoutPage.page).toHaveTitle('Send | Sendtag')

  for (const tag of tagsToRegister) {
    await expect(checkoutPage.page.getByRole('heading', { name: tag })).toBeVisible()
  }

  await expect(supabase).toHaveEventInActivityFeed({
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
