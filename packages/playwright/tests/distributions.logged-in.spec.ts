import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'
// import { Tables } from '@my/supabase/database.types'
import { expect, test } from './fixtures/send-accounts'
// import { Page } from '@playwright/test'

let log: debug.Debugger

test.beforeEach(async ({ page }) => {
  log = debug(`test:distributions:logged-in:${test.info().parallelIndex}`)
  log('beforeEach', `url=${page.url()}`)
  // TODO: Make user eligible for distributions
})

test('can visit distributions page', async ({ page }) => {
  await page.goto('/distributions')
  await expect(page).toHaveURL('/distributions')
})
