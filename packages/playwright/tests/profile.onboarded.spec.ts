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

test.skip('can visit other user profile', async ({ page, seed }) => {
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
  await expect(page.getByTestId('sendDialogContainer')).toBeVisible()
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
