import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as supawrightTest } from '@my/playwright/fixtures/supawright'
import { debug, Debugger } from 'debug'
import { createOtherUser } from './fixtures/supawright'
import { assert } from 'app/utils/assert'

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

test('can visit private profile', async ({ page, supawright }) => {
  const { otherUser, tag, profile } = await createOtherUser(supawright)
  const { error } = await supawright
    .supabase('public')
    .from('profiles')
    .update({
      is_public: false,
    })
    .eq('id', otherUser.id)
  assert(!error, error?.message)
  const { data, error: updateError } = await supawright
    .supabase('public')
    .from('profiles')
    .select('is_public')
    .eq('id', otherUser.id)
    .maybeSingle()
  assert(!updateError, updateError?.message)
  assert(data?.is_public === false, 'profile should be private')
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
