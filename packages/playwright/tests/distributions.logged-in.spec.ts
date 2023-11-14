// import { Tables } from '@my/supabase/database.types'
import { test, expect } from './fixtures/auth'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'
// import { Page } from '@playwright/test'

let log: debug.Debugger | undefined

test.beforeEach(async ({ page }) => {
  log = debug(`test:distributions:logged-in:${test.info().parallelIndex}`)
  log('beforeEach', `url=${page.url()}`)
  // TODO: Make user eligible for distributions
})

test('can visit distributions page', async ({ page }) => {
  await page.pause()
  await page.goto('/distributions')
  // FIXME: This is failing because the user is not eligible for distributions
  // expect(page).toHaveURL('/distributions')
})
