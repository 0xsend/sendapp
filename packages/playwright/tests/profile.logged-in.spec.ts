import { expect, test as authTest } from './fixtures/auth'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { OnboardingPage } from './fixtures/send-accounts'
import { mergeTests } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { userOnboarded } from '@my/snaplet/models'
import { ProfilePage } from './fixtures/profiles'

const test = mergeTests(snapletTest, authTest)

test('logged in user needs onboarding before visiting profile', async ({ page, seed, pg }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const account = plan.send_accounts[0]
  assert(!!tag, 'tag not found')

  // Set up the send_account_tag and activate account
  await pg.query(
    `
    INSERT INTO send_account_tags (tag_id, send_account_id)
    VALUES ($1, $2)
  `,
    [tag.id, account.id]
  )

  const profile = plan.profiles[0]
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
  await expect(async () => {
    expect(await page.title()).toBe('Send | Profile')
  }).toPass()
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await expect(page.getByText(profile.name)).toBeVisible()
  await expect(profilePage.sendButton).toBeVisible()
})
