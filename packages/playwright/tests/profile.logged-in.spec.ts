import { expect, test as authTest } from './fixtures/auth'
import { test as supawrightTest } from '@my/playwright/fixtures/supawright'
import { debug, Debugger } from 'debug'
import { createOtherUser } from './fixtures/supawright'
import { assert } from 'app/utils/assert'
import { OnboardingPage } from './fixtures/send-accounts'
import { mergeTests } from '@playwright/test'

const test = mergeTests(supawrightTest, authTest)

let log: Debugger

test.beforeAll(async () => {
  log = debug('test:profile:anon')
})

test('logged in user needs onboarding before visiting profile', async ({ page, supawright }) => {
  const { tag } = await createOtherUser(supawright)
  await page.goto(`/profile/${tag.name}`)
  expect(await page.title()).toBe('Send | Onboarding')
  await new OnboardingPage(page).completeOnboarding(expect)

  // @todo check that user is redirected back to profile page

  await page.goto(`/profile/${tag.name}`)

  expect(await page.title()).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
})
