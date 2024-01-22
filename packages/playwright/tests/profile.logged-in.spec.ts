import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as supawrightTest } from '@my/playwright/fixtures/supawright'
import { debug, Debugger } from 'debug'
import { faker } from '@faker-js/faker'
import type { Supawright } from 'supawright'
import { Database } from '@my/supabase/database.types'

const test = mergeTests(sendAccountTest, supawrightTest)

let log: Debugger

test.beforeAll(async () => {
  log = debug('test:profile:logged-in')
})

// @todo this should be in a fixture
async function createOtherUser(supawright: Supawright<Database, 'public'>) {
  const otherUser = await supawright.createUser({})
  const profile = {
    name: faker.person.fullName(),
    about: faker.lorem.sentence(),
    avatar_url: faker.image.avatar(),
  }
  const { error } = await supawright
    .supabase('public')
    .from('profiles')
    .update(profile)
    .eq('id', otherUser.id)
  if (error) {
    console.error('error updating profile', error)
    throw error
  }

  const tag = await supawright.create('tags', {
    status: 'confirmed',
    user_id: otherUser.id,
  })
  const acct = await supawright.create('send_accounts', {
    user_id: otherUser.id,
  })
  return { otherUser, profile, tag, acct }
}

test('should work', async ({ page, supawright }) => {
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
