import { assert } from 'app/utils/assert'
import { expect, test } from './fixtures/send-accounts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('/')
  await page.getByRole('link', { name: 'account' }).click()
  await page.waitForURL('/account')
})

test('can visit account page', async ({ page, context, user: { profile } }) => {
  assert(!!profile, 'profile not found')
  assert(!!profile.referral_code, 'referral code not found')
  await expect(page).toHaveURL('/account')

  // @todo add back when we figure out if we want to support firefox
  // copy referral code
  // const referralCode = page.getByRole('button', { name: 'Copy' })
  // await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  // await referralCode.click()
  // await expect(page.getByText('Copy')).toBeVisible()
  // const handle = await page.evaluateHandle(() => navigator.clipboard.readText())
  // const clipboardContent = await handle.jsonValue()
  // const url = new URL(page.url())
  // url.searchParams.set('referral', profile.referral_code)
  // url.pathname = ''
})

test('can update profile', async ({ page, supabase }) => {
  const editProfileButton = page.getByRole('link', { name: 'Settings' })
  await editProfileButton.click()

  await page.waitForURL('/account/settings/edit-profile')
  await expect(page).toHaveTitle('Send | Edit Profile')

  await page.getByLabel('Name').fill('LeO')
  await page.getByLabel('Bio').fill('Sender')
  await page.getByLabel('Public?').setChecked(true)

  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Notification Successfully updated')).toBeVisible()

  const { data: user, error } = await supabase.from('profiles').select('*').maybeSingle()
  expect(error).toBeFalsy()
  expect(user).toBeTruthy()
  expect(user?.name === 'LeO' && user.about === 'Sender' && user.is_public === true).toBeTruthy()
})

test('can backup account', async ({ page, supabase }) => {
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.waitForURL('/account/settings/edit-profile')
  await page.locator('[id="__next"]').getByRole('link', { name: 'Backup' }).click()
  await expect(page).toHaveURL('/account/settings/backup')

  const { data: cred, error } = await supabase
    .from('webauthn_credentials')
    .select('*')
    .maybeSingle()
  expect(error).toBeFalsy()
  assert(!!cred, 'cred not found')

  expect(cred).toBeTruthy()
  expect(page.getByText(cred.display_name)).toBeVisible()
  expect(page.getByText(cred.created_at)).toBeVisible()
  // @todo add backup device with new webauthn credential
})
