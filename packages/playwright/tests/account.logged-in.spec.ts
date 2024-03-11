import { expect, test } from './fixtures/send-accounts'

test.beforeEach(async ({ page }) => {
  await page.goto('/account')
})

test('can visit account page', async ({ page }) => {
  await expect(page).toHaveURL('/account')
})

test('can update profile', async ({ page, supabase }) => {
  const editProfileButton = page.getByRole('button', { name: 'Edit Profile' })
  await editProfileButton.click()

  await page.waitForURL('/account/profile')
  await expect(page).toHaveTitle('Account')

  await page.getByLabel('Name').fill('LeO')
  await page.getByLabel('About').fill('Sender')
  await page.getByLabel('IsPublic').setChecked(true)

  await page.getByRole('button', { name: 'Update Profile' }).click()

  await expect(page.getByText('Notification Successfully updated')).toBeVisible()

  const { data, error } = await supabase.auth.getSession()
  expect(error).toBeFalsy()

  if (data.session) {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session?.user.id)
      .maybeSingle()
    expect(error).toBeFalsy()
    expect(user).toBeTruthy()
    expect(user?.name === 'LeO' && user.about === 'Sender' && user.is_public === true).toBeTruthy()
  }
})
