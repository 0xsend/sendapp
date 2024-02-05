import debug from 'debug'
import { expect, test } from './fixtures/send-accounts'

let log: debug.Debugger

test.beforeEach(() => {
  log = debug(`test:updating-profile:logged-in:${test.info().parallelIndex}`)
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
})
