import { assert } from 'app/utils/assert'
import debug from 'debug'
import { expect, test } from './fixtures/send-accounts'

let log: debug.Debugger

test.beforeEach(async ({ page, user: { user } }) => {
  log = debug(`test:account:logged-in:${user.id}:${test.info().parallelIndex}`)
  await page.goto('/')
  await page.waitForURL('/')
  const accountLink = page.getByRole('link', { name: 'Account' })
  await expect(accountLink).toBeVisible()
  await accountLink.click()
  await page.waitForURL('/account')
})

test('can visit account page', async ({ page, user: { profile } }) => {
  assert(!!profile, 'profile not found')
  assert(!!profile.referral_code, 'referral code not found')
  await expect(page).toHaveURL('/account')

  // @todo add back when we figure out if we want to support firefox
  // copy referral code
  // const referral_code = page.getByRole('button', { name: 'Copy' })
  // await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  // await referral_code.click()
  // await expect(page.getByText('Copy')).toBeVisible()
  // const handle = await page.evaluateHandle(() => navigator.clipboard.readText())
  // const clipboardContent = await handle.jsonValue()
  // const url = new URL(page.url())
  // url.searchParams.set('referral', profile.referral_code)
  // url.pathname = ''
})

test('can update profile', async ({ page, supabase }) => {
  await page.getByRole('link', { name: 'profile' }).click()
  await page.waitForURL('/account/edit-profile')
  await expect(page).toHaveTitle('Send | Edit Profile')

  await page.getByRole('button', { name: 'edit profile' }).click()
  // Wait for form fields to be ready (form renders after clicking edit)
  const nameField = page.getByRole('textbox', { name: 'Name' })
  await expect(nameField).toBeVisible({ timeout: 5_000 })
  await nameField.fill('LeO')
  await page.getByRole('textbox', { name: 'About' }).fill('Sender')
  await page.getByRole('checkbox').setChecked(true)

  await page.getByRole('button', { name: 'SAVE CHANGES' }).click()

  await expect(page.getByText('Notification Successfully updated')).toBeVisible()

  const { data: user, error } = await supabase.from('profiles').select('*').maybeSingle()
  expect(error).toBeFalsy()
  expect(user).toBeTruthy()
  expect(user?.name === 'LeO' && user.about === 'Sender' && user.is_public === true).toBeTruthy()
})
