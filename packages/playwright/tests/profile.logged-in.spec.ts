import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as supawrightTest } from '@my/playwright/fixtures/supawright'
import { debug, Debugger } from 'debug'

const test = mergeTests(sendAccountTest, supawrightTest)

let log: Debugger

test.beforeAll(async () => {
  log = debug('send:profile:logged-in')
})

test('should work', async ({ page, supawright }) => {
  const result = await supawright.createUser({})
  log('created profile', result)
  const tagResult = await supawright.create('tags', {
    status: 'confirmed',
    user_id: result.id,
  })
  log('created tag1', tagResult)
  expect(result).toBeDefined()
  await page.goto(`/profile/${tagResult.name}`)
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.getByRole('heading', { name: tagResult.name })).toBeVisible()
})
