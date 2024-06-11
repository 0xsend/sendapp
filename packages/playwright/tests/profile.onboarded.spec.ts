import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { debug, type Debugger } from 'debug'
import { assert } from 'app/utils/assert'
import { userOnboarded } from '@my/snaplet/src/models'
import { ProfilePage } from './fixtures/profiles'

const test = mergeTests(sendAccountTest, snapletTest)

let log: Debugger

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
  await expect(profilePage.requestButton).toBeVisible()
  await profilePage.sendButton.click()
  await page.waitForURL(`/send?recipient=${tag.name}`)
  await expect(page.getByText('Enter Amount')).toBeVisible()

  // visit another user but without a sendtag
  const plan2 = await seed.users([{ ...userOnboarded, tags: [] }])
  const tag2 = plan2.tags[0]
  assert(!tag2, 'should not have a tag')
  const profile2 = plan2.profiles[0]
  assert(!!profile2?.sendId, 'profile send_id not found')
  assert(!!profile2?.name, 'profile name not found')
  assert(!!profile2?.about, 'profile about not found')
  const profilePage2 = new ProfilePage(page, { name: profile2.name, about: profile2.about })
  await page.goto(`/profile/${profile2.sendId}`)
  await expect(profilePage2.sendButton).toBeVisible()
  await expect(profilePage2.requestButton).toBeVisible()
  await profilePage2.sendButton.click()
  // fix sending to send IDs
  // await page.waitForURL(`/account/send?recipient=${profile2.sendId}`)
  await expect(page.getByText('Enter Amount')).toBeVisible()

  // can visit profile withouth the @ prefix
  await page.goto(`/${tag.name}`)
  expect(await page.title()).toBe('Send | Profile')
  await expect(page.getByText(tag.name)).toBeVisible()
})

test('can visit my own profile', async ({
  page,
  seed,
  user: {
    user: { id: userId },
    profile,
  },
}) => {
  const plan = await seed.tags([{ userId, status: 'confirmed' }])
  const tag = plan.tags[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).not.toBeVisible()
  await expect(profilePage.requestButton).not.toBeVisible()
})

test('can visit private profile', async ({ page, seed }) => {
  const plan = await seed.users([{ ...userOnboarded, profiles: [{ isPublic: false }] }])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await expect(profilePage.requestButton).toBeVisible()
})
