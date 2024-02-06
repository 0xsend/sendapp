import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'
// import { Tables } from '@my/supabase/database.types'
import { expect, test } from './fixtures/send-accounts'
// import { Page } from '@playwright/test'

let log: debug.Debugger

test.beforeEach(async ({ page }) => {
  log = debug(`test:profile:logged-in:${test.info().parallelIndex}`)
  log('beforeEach', `url=${page.url()}`)
  // TODO: Make user eligible for distributions
})

test('can visit settings page', async ({ page }) => {
  await page.goto('/settings')
  await expect(page).toHaveURL('/settings')
})

test('can update profile', async ({ page }) => {
  await page.goto('/settings')
  log('beforeEach', `url=${page.url()}`)
  const editProfileButton = page.getByRole('button', { name: 'Edit Profile' })
  await editProfileButton.click()

  await page.waitForNavigation()
  await expect(page).toHaveTitle('Account')

  await page.getByLabel('Name').fill('LeO')
  await page.getByLabel('About').fill('Sender')
  await page.getByLabel('IsPublic').setChecked(true)

  await page.getByRole('button', { name: 'Update Profile' }).click()

  await expect(page.getByText('Successfully updated')).toBeVisible()

  const { data, error } = await supabaseAdmin.auth.getSession()
  expect(error).toBeFalsy()

  if (data.session) {
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.session?.user.id)
      .maybeSingle()
    expect(error).toBeFalsy()
    expect(user).toBeTruthy()
    expect(user?.name === 'LeO' && user.about === 'Sender' && user.is_public === true).toBeTruthy()
  }
})
