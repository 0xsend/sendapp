import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { debug, Debugger } from 'debug'
import { assert } from 'app/utils/assert'
import { userOnboarded } from '@my/snaplet/src/models'

const test = mergeTests(sendAccountTest, snapletTest)

let log: Debugger

test.beforeAll(async () => {
  log = debug(`test:profile:logged-in:${test.info().workerIndex}`)
})

test('can visit other user profile', async ({ page, seed }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag, 'tag not found')
  assert(!!profile && profile.name !== null, 'profile not found')
  assert(!!profile && profile.about !== null, 'profile not found')
  await page.goto(`/profile/${tag.name}`)
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  await expect(page.getByRole('heading', { name: profile.name })).toBeVisible()
  await expect(page.getByText(profile.about, { exact: true })).toBeVisible()
  await expect(page.getByAltText(profile.name)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request' })).toBeVisible()
})

test('can visit my own profile', async ({
  page,
  seed,
  user: {
    user: { id: userId },
  },
  profile,
}) => {
  const { tags } = await seed.tags([{ userId, status: 'confirmed' }])
  const tag = tags[0]
  assert(!!tag, 'tag not found')
  await page.goto(`/profile/${tag.name}`)
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  await expect(page.getByRole('heading', { name: profile.name })).toBeVisible()
  await expect(page.getByText(profile.about, { exact: true })).toBeVisible()
  await expect(page.getByAltText(profile.name)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Request' })).not.toBeVisible()
})

test('can visit private profile', async ({ page, seed }) => {
  const plan = await seed.users([{ ...userOnboarded, profiles: [{ isPublic: false }] }])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag, 'tag not found')
  assert(!!profile && profile.isPublic === false, 'profile should be private')
  assert(!!profile && profile.name !== null, 'profile not found')
  assert(!!profile && profile.about !== null, 'profile not found')
  await page.goto(`/profile/${tag.name}`)
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  await expect(page.getByRole('heading', { name: profile.name })).toBeVisible()
  await expect(page.getByText(profile.about, { exact: true })).toBeVisible()
  await expect(page.getByAltText(profile.name)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request' })).toBeVisible()
})
