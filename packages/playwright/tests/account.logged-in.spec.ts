import type { Attestation } from '@0xsend/webauthn-authenticator/types'
import { parseCredAuthData } from '@0xsend/webauthn-authenticator/utils'
import { assert } from 'app/utils/assert'
import { hexToPgBase16 } from 'app/utils/hexToPgBase16'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { pgBase16ToHex } from 'app/utils/pgBase16ToHex'
import cbor from 'cbor'
import { checksumAddress, withRetry } from 'viem'
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
  await page.waitForURL('account/settings/backup/add-passkey')

  const acctName = `test-${Math.floor(Math.random() * 1000000)}`
  await page.getByRole('textbox', { name: 'Passkey name' }).fill(acctName)
  await expect(page.getByLabel('Passkey name')).toHaveValue(acctName)
  const request = page.waitForRequest('**/rest/v1/rpc/send_accounts_add_webauthn_credential')
  const response = page.waitForResponse('**/rest/v1/rpc/send_accounts_add_webauthn_credential')
  await page.getByRole('button', { name: 'Create Passkey' }).click()
  await request
  await response

  // assert passkey was created
  const credentials = authenticator.credentials
  expect(Object.values(credentials).length).toBe(2)
  const credential = Object.values(credentials)[1]
  assert(!!credential, 'Missing credential')
  expect(credential.attestations.length).toBe(1)

  const attestation = credential.attestations[0]
  assert(!!attestation, 'Missing credential attestation')

  const { clientDataJSON, attestationObject } = attestation
  assert(!!clientDataJSON && !!attestationObject, 'Missing clientDataJSON or attestationObject')

  // validate send account is created
  const { data: sendAccts, error: sendAcctErr } = await supabase
    .from('send_accounts')
    .select('*, send_account_credentials(*), webauthn_credentials(*)')
  if (sendAcctErr) {
    throw sendAcctErr
  }

  const sendAcct = sendAccts[0]
  assert(!!sendAcct, 'Missing send account')

  expect(sendAcct.init_code).toMatch(/\\x[a-f0-9]+$/i)
  expect(sendAcct.address).toMatch(/^0x[a-f0-9]{40}$/i)

  // verify account credential is created
  const acctCred = sendAcct.send_account_credentials[1]
  assert(!!acctCred, 'Missing account credential')
  expect(acctCred.key_slot).toBe(1)

  // verify webauthn credential
  const webAuthnCred = sendAcct.webauthn_credentials[1]
  assert(!!webAuthnCred, 'Missing webauthn credential')
  expect(webAuthnCred.display_name).toBe(acctName)
  expect(webAuthnCred.name).toBe(`${authSession.decoded.sub}.1`) // key slot 1 == 2nd key added
  expect(webAuthnCred.raw_credential_id).toBe(`\\x${credential.id.toString('hex')}`)
  assert(!!attestation, 'Missing credential attestation')
  expect(webAuthnCred.attestation_object).toBe(
    `\\x${Buffer.from(attestationObject).toString('hex')}`
  )
  const cborAttObj = cbor.decodeAllSync(attestationObject)[0]
  assert(!!cborAttObj, 'Missing cbor attestation object')
  const { authData } = cborAttObj as Attestation
  const { COSEPublicKey: COSEPublicKeyBytes } = parseCredAuthData(authData)
  assert(!!COSEPublicKeyBytes, 'Missing COSEPublicKey')
  const COSEPublicKey = Buffer.from(COSEPublicKeyBytes).toString('hex')
  expect(webAuthnCred.public_key).toBe(`\\x${COSEPublicKey}`)

  const xY = COSEECDHAtoXY(COSEPublicKeyBytes)
  const x = hexToPgBase16(xY[0])
  const y = hexToPgBase16(xY[1])

  await page.getByRole('button', { name: 'Add Passkey as Signer' }).click()

  // retry until signing key is added to the account
  const keyAdded = await withRetry(
    async () => {
      const { data: keyAdded, error: keyAddedErr } = await supabase
        .from('send_account_signing_key_added')
        .select('account, key_slot, key')
        .in('key', [x, y])
        .order('block_num, tx_idx, log_idx, abi_idx')

      if (keyAddedErr) {
        throw keyAddedErr
      }

      if (keyAdded.length === 0) {
        throw new Error('No key added')
      }

      return keyAdded
    },
    {
      retryCount: 10,
      delay: 500,
    }
  )

  // signing key should be added to the account
  expect(keyAdded.length).toBe(2)
  expect(keyAdded[0]?.key_slot).toBe(1)
  const account = checksumAddress(pgBase16ToHex(keyAdded[0]?.account as `\\x${string}`))
  expect(account).toBe(checksumAddress(sendAcct.address))
})
