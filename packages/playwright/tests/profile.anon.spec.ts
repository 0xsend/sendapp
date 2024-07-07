import { test } from '@my/playwright/fixtures/snaplet'
import { userOnboarded } from '@my/snaplet/src/models'
import { expect, type Page } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { debug, type Debugger } from 'debug'
import { ProfilePage } from './fixtures/profiles'

let log: Debugger

test.beforeAll(async () => {
  log = debug(`test:profile:anon:${test.info().parallelIndex}`)
})

const visitProfile = async ({ page, tag }: { page: Page; tag: string }) => page.goto(`/${tag}`)

test('anon user can visit public profile', async ({ page, seed }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  assert(!!tag, 'tag not found')
  const profile = plan.profiles[0]
  assert(!!profile, 'profile not found')
  assert(!!profile.name, 'profile name not found')
  assert(!!profile.about, 'profile about not found')
  await visitProfile({ page, tag: tag.name })
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await expect(profilePage.sendButton).toBeVisible()
  await expect(profilePage.requestButton).toBeVisible()
})

test('anon user cannot visit private profile', async ({ page, seed }) => {
  const plan = await seed.users([{ ...userOnboarded, profiles: [{ isPublic: false }] }])
  const tag = plan.tags[0]
  assert(!!tag, 'tag not found')
  await visitProfile({ page, tag: tag.name })
  const title = await page.title()
  expect(title).toBe('404 | Send')
  await expect(page.getByRole('heading', { name: 'Not found.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Need to sign in?' })).toBeVisible()
})
