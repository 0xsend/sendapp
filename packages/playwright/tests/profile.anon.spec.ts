import { expect, mergeTests } from '@playwright/test'
import { test } from '@my/playwright/fixtures/snaplet'
import { debug, Debugger } from 'debug'
import { assert } from 'app/utils/assert'
import { userOnboarded } from '@my/snaplet/src/models'

let log: Debugger

test.beforeAll(async () => {
  log = debug('test:profile:anon')
})

test('anon user can visit public profile', async ({ page, seed }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  assert(!!tag, 'tag not found')
  await page.goto(`/profile/${tag.name}`)
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tag.name })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request' })).toBeVisible()
})

test('anon user cannot visit private profile', async ({ page, seed }) => {
  const plan = await seed.users([{ ...userOnboarded, profiles: [{ isPublic: false }] }])
  const tag = plan.tags[0]
  assert(!!tag, 'tag not found')
  await page.goto(`/profile/${tag.name}`)
  const title = await page.title()
  expect(title).toBe('404 | Send')
  await expect(page.getByRole('heading', { name: 'Not found.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Need to sign in?' })).toBeVisible()
})
