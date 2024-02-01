import { expect, test as authTest } from './fixtures/auth'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { debug, Debugger } from 'debug'
import { OnboardingPage } from './fixtures/send-accounts'
import { mergeTests } from '@playwright/test'
import { assert } from 'app/utils/assert'

const test = mergeTests(snapletTest, authTest)

let log: Debugger

test.beforeAll(async () => {
  log = debug(`test:profile:anon:${test.info().parallelIndex}`)
})

test('logged in user needs onboarding before visiting profile', async ({ page, seed }) => {
  const plan = await seed.users([
    {
      profiles: [{}],
      tags: [
        {
          status: 'confirmed',
        },
      ],
      sendAccounts: [{}],
    },
  ])
  log(plan.tags)
  const tag = plan.tags[0]
  assert(!!tag, 'tag not found')
  await page.goto(`/profile/${tag.name}`)
  expect(await page.title()).toBe('Send | Onboarding')
  await new OnboardingPage(page).completeOnboarding(expect)

  // @todo check that user is redirected back to profile page

  await page.goto(`/profile/${tag.name}`)

  expect(await page.title()).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
})
