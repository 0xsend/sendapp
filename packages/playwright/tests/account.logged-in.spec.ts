import { expect, test } from './fixtures/send-accounts'

test.beforeEach(async ({ page }) => {
  await page.goto('/account')
})

test('can visit account page', async ({ page }) => {
  await expect(page).toHaveURL('/account')
})

test('can update profile', async ({ page, supabase }) => {
  const editProfileButton = page.getByRole('link', { name: 'Settings' })
  await editProfileButton.click()

  await page.waitForURL('/account/settings/edit-profile')
  await expect(page).toHaveTitle('Edit Profile')

  await page.getByLabel('User Name').fill('LeO')
  await page.getByLabel('Bio').fill('Sender')
  await page.getByLabel('Is Public').setChecked(true)

  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Notification Successfully updated')).toBeVisible()

  const { data: user, error } = await supabase.from('profiles').select('*').maybeSingle()
  expect(error).toBeFalsy()
  expect(user).toBeTruthy()
  expect(user?.name === 'LeO' && user.about === 'Sender' && user.is_public === true).toBeTruthy()
})
