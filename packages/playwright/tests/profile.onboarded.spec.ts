import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import debug from 'debug'
import { assert } from 'app/utils/assert'
import { createUserWithTagsAndAccounts, createUserWithoutTags } from '@my/snaplet'
import { ProfilePage } from './fixtures/profiles'
import { MockActivityFeed } from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import { SUPABASE_URL } from 'app/utils/supabase/admin'

const test = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

test.beforeAll(async () => {
  log = debug(`test:profile:logged-in:${test.info().workerIndex}`)
})

test('can visit other user profile and send by tag', async ({ page, seed }) => {
  test.setTimeout(120000) // Longer timeout for this complex test
  const { profile, tags } = await createUserWithTagsAndAccounts(seed, {
    tagCount: 1,
  })
  const tag = tags[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()
  // SendChat opens inline on profile page - verify the send form appears with correct recipient
  await expect(page.getByPlaceholder('Type amount, add a note...')).toBeVisible({ timeout: 10000 })
  // Verify URL params are set correctly for the recipient
  const url = new URL(page.url())
  expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({
    recipient: profile.send_id.toString(),
    idType: 'sendid',
  })

  // visit another user but without a sendtag
  const plan2 = await createUserWithTagsAndAccounts(seed, { tagCount: 0 })
  const tag2 = plan2.tags[0]
  assert(!tag2, 'should not have a tag')
  const profile2 = plan2.profile
  assert(!!profile2?.send_id, 'profile send_id not found')
  assert(!!profile2?.name, 'profile name not found')
  assert(!!profile2?.about, 'profile about not found')
  const profilePage2 = new ProfilePage(page, { name: profile2.name, about: profile2.about })
  await page.goto(`/profile/${profile2.send_id}`, { timeout: 60000 })
  // Wait for profile to load (longer timeout for Firefox)
  await expect(page.getByTestId('profileName')).toHaveText(profile2.name, { timeout: 25000 })
  await expect(profilePage2.sendButton).toBeVisible()
  await profilePage2.sendButton.click()
  // SendChat opens inline on profile page - verify the send form appears with correct recipient
  await expect(page.getByPlaceholder('Type amount, add a note...')).toBeVisible({ timeout: 10000 })
  // Verify URL params are set correctly for the recipient
  const url2 = new URL(page.url())
  expect(Object.fromEntries(url2.searchParams.entries())).toMatchObject({
    recipient: profile2.send_id.toString(),
    idType: 'sendid',
  })

  // can visit profile without the @ prefix
  await page.goto(`/${tag.name}`, { timeout: 60000 })
  await page.waitForURL(`/${tag.name}`)
  // Wait for profile to load (longer timeout for Firefox)
  await expect(page.getByTestId('profileName')).toHaveText(profile.name, { timeout: 25000 })
})

test('can visit my own profile', async ({ page, supabase, user: { profile } }) => {
  const { data, error } = await supabase.from('tags').select('*')
  assert(!!data, 'tags not found')
  expect(error).toBeFalsy()
  const tag = data[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
})

test('can visit private profile', async ({ page, seed }) => {
  const plan = await createUserWithTagsAndAccounts(seed, { isPublic: false })
  const tag = plan.tags[0]
  const account = plan.sendAccount
  assert(!!tag?.name, 'tag not found')
  assert(!!account?.id, 'account not found')

  const profile = plan.profile
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
  const plan = await createUserWithoutTags(seed)
  const anotherUser = plan.profile
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

  // Navigate to profile history page to see activities between users
  await page.goto(`/profile/${anotherUser.send_id}/history`)
  // Wait for page to load
  await expect(page.getByText(anotherUser.name)).toBeVisible({ timeout: 15000 })

  log('beforeEach', `url=${page.url()}`)

  // Wait for activity data to load with longer timeout
  await expect(page.getByText('7/18/2024')).toBeVisible({ timeout: 15000 })
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
