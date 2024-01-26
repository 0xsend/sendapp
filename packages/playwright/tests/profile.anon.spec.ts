import { expect, mergeTests } from '@playwright/test'
import { test } from '@my/playwright/fixtures/supawright'
import { debug, Debugger } from 'debug'
import { createOtherUser } from './fixtures/supawright'
import { assert } from 'app/utils/assert'

let log: Debugger

test.beforeAll(async () => {
  log = debug('test:profile:anon')
})

test('anon user can visit public profile', async ({ page, supawright }) => {
  const { tag } = await createOtherUser(supawright)
  await page.goto(`/profile/${tag.name}`)
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request' })).toBeVisible()
})

test('anon user cannot visit private profile', async ({ page, supawright }) => {
  const { otherUser, tag } = await createOtherUser(supawright)
  const { error } = await supawright
    .supabase('public')
    .from('profiles')
    .update({
      is_public: false,
    })
    .eq('id', otherUser.id)
  assert(!error, error?.message)
  await page.goto(`/profile/${tag.name}`)
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Request' })).not.toBeVisible()
})
