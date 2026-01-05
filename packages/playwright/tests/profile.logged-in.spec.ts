import { expect, test as authTest } from './fixtures/auth'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { OnboardingPage } from './fixtures/send-accounts'
import { mergeTests } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { createUserWithTagsAndAccounts } from '@my/snaplet/models'
import { ProfilePage } from './fixtures/profiles'

const test = mergeTests(snapletTest, authTest)

test('logged in user needs onboarding before visiting profile', async ({ page, seed, pg }) => {
  const plan = await createUserWithTagsAndAccounts(seed)
  const tag = plan.tags[0]
  const account = plan.sendAccount
  assert(!!tag, 'tag not found')

  const profile = plan.profile
  assert(!!profile, 'profile not found')
  assert(!!profile.name, 'profile name not found')
  assert(!!profile.about, 'profile about not found')

  await page.goto(`${tag.name}`)
  await page.waitForURL('/auth/onboarding')

  await expect(async () => {
    expect(await page.title()).toBe('Send | Onboarding')
  }).toPass()

  await new OnboardingPage(page).completeOnboarding(expect)

  await page.goto(`/profile/${profile.send_id}`)
  await page.waitForURL(`/profile/${profile.send_id}`)
  // Profile title is dynamic: shows "Send | {name}" when user has a name
  await expect(async () => {
    expect(await page.title()).toBe(`Send | ${profile.name}`)
  }).toPass()
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await expect(page.getByText(profile.name)).toBeVisible()
  await expect(profilePage.sendButton).toBeVisible()
})
