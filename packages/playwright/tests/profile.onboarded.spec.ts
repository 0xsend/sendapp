import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import debug from 'debug'
import { assert } from 'app/utils/assert'
import { userOnboarded } from '@my/snaplet/models'
import { ProfilePage } from './fixtures/profiles'
import { MockActivityFeed } from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import { SUPABASE_URL } from 'app/utils/supabase/admin'

const test = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

test.beforeAll(async () => {
  log = debug(`test:profile:logged-in:${test.info().workerIndex}`)
})

test('can visit other user profile and send by tag', async ({ page, seed }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()
  await page.waitForURL(/\/send/)
  let url = new URL(page.url())
  expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({
    recipient: tag.name,
    idType: 'tag',
  })
  await expect(page.locator('h2', { hasText: 'Enter Amount' })).toBeVisible()

  // visit another user but without a sendtag
  const plan2 = await seed.users([{ ...userOnboarded, tags: [] }])
  const tag2 = plan2.tags[0]
  assert(!tag2, 'should not have a tag')
  const profile2 = plan2.profiles[0]
  assert(!!profile2?.send_id, 'profile send_id not found')
  assert(!!profile2?.name, 'profile name not found')
  assert(!!profile2?.about, 'profile about not found')
  const profilePage2 = new ProfilePage(page, { name: profile2.name, about: profile2.about })
  await page.goto(`/profile/${profile2.send_id}`)
  await expect(profilePage2.sendButton).toBeVisible()
  await profilePage2.sendButton.click()
  await page.waitForURL(/\/send/)
  url = new URL(page.url())
  expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({
    recipient: profile2?.send_id.toString(),
    idType: 'sendid',
  })
  await expect(page.locator('h2', { hasText: 'Enter Amount' })).toBeVisible()

  // can visit profile withouth the @ prefix
  await page.goto(`/${tag.name}`)
  await page.waitForURL(`/${tag.name}`)
  await expect(async () => {
    const title = await page.title()
    expect(title).toBe('Send | Profile')
  }).toPass()
  await expect(page.getByText(profile.name)).toBeVisible()
})

test('can visit my own profile', async ({
  page,
  seed,
  user: {
    user: { id: user_id },
    profile,
  },
}) => {
  const plan = await seed.tags([{ user_id, status: 'confirmed' }])
  const tag = plan.tags[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).not.toBeVisible()
})

test('can visit private profile', async ({ page, seed }) => {
  const plan = await seed.users([
    { ...userOnboarded, profiles: [{ is_public: false, x_username: null }] },
  ])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
})

test('can view activities between another profile', async ({
  page,
  pg,
  user: { profile },
  seed,
}) => {
  const plan = await seed.users([{ ...userOnboarded, tags: [] }])
  const anotherUser = plan.profiles[0]
  assert(!!anotherUser, 'another user not found')
  assert(!!anotherUser.name, 'another user name not found')
  assert(!!anotherUser.about, 'another user about not found')

  // Filter out everything except `send_account_transfers`
  const activities = MockActivityFeed.flatMap((t) => {
    return t.event_name === 'send_account_transfers'
      ? {
          event_name: t.event_name,
          event_id: crypto.randomUUID(),
          from_user_id: t.from_user?.id ? profile.id : anotherUser.id,
          to_user_id: t.to_user?.id ? profile.id : anotherUser.id,
          created_at: new Date(t.created_at).toISOString(),
          // biome-ignore lint/suspicious/noExplicitAny: mock
          data: t.data as any,
        }
      : []
  })
  for (const row of activities) {
    await pg.query(
      'insert into activity (event_name, event_id, from_user_id, to_user_id, created_at, data) values ($1, $2, $3, $4, $5, $6)',
      [row.event_name, row.event_id, row.from_user_id, row.to_user_id, row.created_at, row.data]
    )
  }

  const res = page.waitForResponse(`${SUPABASE_URL}/rest/v1/activity_feed*`)
  const profilePage2 = new ProfilePage(page, { name: anotherUser.name, about: anotherUser.about })
  await page.goto(`/profile/${anotherUser.send_id}`)
  await res

  log('beforeEach', `url=${page.url()}`)

  await expect(profilePage2.sendButton).toBeVisible()
  await expect(page.getByText('7/18/2024')).toBeVisible()
  await expect(page.getByText('You Received').nth(1)).toBeVisible()
  await expect(page.getByText('8 USDC')).toBeVisible()
  await expect(page.getByText('5/27/2024')).toBeVisible()
  await expect(page.getByText('You Sent').first()).toBeVisible()
  await expect(page.getByText('0.07 USDC')).toBeVisible()
  await expect(page.getByText('5/26/2024')).toBeVisible()
  await expect(page.getByText('You Received').first()).toBeVisible()
  await expect(page.getByText('0.01 USDC')).toBeVisible()
  await expect(page.getByText(anotherUser.name)).toBeVisible()
})
