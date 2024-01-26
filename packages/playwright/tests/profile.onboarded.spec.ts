import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as supawrightTest } from '@my/playwright/fixtures/supawright'
import { debug, Debugger } from 'debug'
import { createOtherUser } from './fixtures/supawright'

const test = mergeTests(sendAccountTest, supawrightTest)

let log: Debugger

test.beforeAll(async () => {
  log = debug('test:profile:logged-in')
})

test('can visit other user profile', async ({ page, supawright }) => {
  const { otherUser, profile, tag } = await createOtherUser(supawright)
  expect(otherUser).toBeDefined()
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
  supawright,
  user: {
    user: { id: userId },
  },
  profile,
}) => {
  const tag = await supawright.create('tags', {
    status: 'confirmed',
    user_id: userId,
  })
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
