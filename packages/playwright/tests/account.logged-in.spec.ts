import { assert } from 'app/utils/assert'
import { expect, test } from './fixtures/send-accounts'
import { throwIf } from 'app/utils/throwIf'
import { debug } from 'debug'

let log: debug.Debugger

test.beforeEach(async ({ page, user: { user } }) => {
  log = debug(`test:account:logged-in:${user.id}:${test.info().parallelIndex}`)
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

test('can backup account', async ({ page, supabase, authenticator, authSession }) => {
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.waitForURL('/account/settings/edit-profile')
  await page.locator('[id="__next"]').getByRole('link', { name: 'Backup' }).click()
  await expect(page).toHaveURL('/account/settings/backup')

  const { data: cred, error } = await supabase.from('webauthn_credentials').select('*').single()
  expect(error).toBeFalsy()
  assert(!!cred, 'cred not found')

  expect(cred).toBeTruthy()
  expect(page.getByText(cred.display_name)).toBeVisible()
  expect(page.getByText(cred.created_at)).toBeVisible()

  await page.getByRole('link', { name: 'Add Passkey' }).click()
  await page.waitForURL('/account/settings/backup/create')

  const acctName = `test-${Math.floor(Math.random() * 1000000)}`
  await page.getByRole('textbox', { name: 'Passkey name' }).fill(acctName)
  await expect(page.getByLabel('Passkey name')).toHaveValue(acctName)
  const request = page.waitForRequest('**/rest/v1/rpc/send_accounts_add_webauthn_credential')
  const response = page.waitForResponse('**/rest/v1/rpc/send_accounts_add_webauthn_credential')
  await page.getByRole('button', { name: 'Create Passkey' }).click()
  await request
  await response

  // validate send account is created
  const { data: sendAcct, error: sendAcctErr } = await supabase
    .from('send_accounts')
    .select('*, send_account_credentials(*), webauthn_credentials(*)')
    .order('created_at', { referencedTable: 'webauthn_credentials' })
    .single()
  throwIf(sendAcctErr)
  assert(!!sendAcct, 'No send account found')
  const acctCred = sendAcct.send_account_credentials[1]
  assert(!!acctCred, 'Missing account credential')
  const webAuthnCred = sendAcct.webauthn_credentials[1]
  assert(!!webAuthnCred, 'Missing webauthn credential')

  await page.waitForURL(`/account/settings/backup/confirm/${webAuthnCred.id}`)
  const bundlerReq = page.waitForRequest('**/rpc')
  const bundlerRes = page.waitForResponse('**/rpc')
  const confirmBtn = page.getByRole('button', { name: 'Add Passkey as Signer' })
  await confirmBtn.click()
  await bundlerReq
  await bundlerRes // wait for bundler response
  await expect.soft(confirmBtn).toBeHidden() // page navigates after successful mutation
  await expect(page.getByText('Something went wrong: Error:')).toBeHidden() // no error
  await page.waitForURL('/account/settings/backup') // yay, we're back on the page

  await expect(supabase).toHaveValidWebAuthnCredentials(authenticator)
})
