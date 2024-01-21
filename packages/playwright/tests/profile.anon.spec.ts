import { expect, mergeTests } from '@playwright/test'
import { test } from '@my/playwright/fixtures/supawright'
import { debug, Debugger } from 'debug'
import { createOtherUser } from './fixtures/supawright'

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
