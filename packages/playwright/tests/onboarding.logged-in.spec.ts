/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { testBaseClient, baseMainnetClient } from './fixtures/viem/base'
import { test, expect } from './fixtures/auth'
import { Hex, parseEther } from 'viem'
import { assert } from 'app/utils/assert'
import { parseCredAuthData } from '@0xsend/webauthn-authenticator/utils'
import { Attestation } from '@0xsend/webauthn-authenticator/types'
import cbor from 'cbor'

// TODO: consider creating an onboarding page fixture
test('can visit onboarding page', async ({ page, credentialsStore, supabase, authSession }) => {
  await page.goto('/onboarding')
  expect(page).toHaveURL('/onboarding')

  // choose a random account name
  const acctName = `test-${Math.floor(Math.random() * 1000000)}`
  await page.getByRole('textbox', { name: 'Account name:' }).fill(acctName)
  await expect(page.getByLabel('Account name:')).toHaveValue(acctName)

  await page.getByRole('button', { name: 'Create' }).click()

  // assert passkey was created
  expect(Object.values(credentialsStore).length).toBe(1)
  const credential = Object.values(credentialsStore)[0]
  assert(!!credential, 'Missing credential')
  expect(credential.attestations.length).toBe(1)

  const attestation = credential.attestations[0]
  assert(!!attestation, 'Missing credential attestation')

  const { clientDataJSON, attestationObject } = attestation
  assert(!!clientDataJSON && !!attestationObject, 'Missing clientDataJSON or attestationObject')

  // validate sender address is computed
  const addrLocator = page.getByLabel('Your sender address:')
  await expect(addrLocator).toHaveValue(/^0x[a-f0-9]{40}$/i)

  // validate send account is created
  const { data: sendAcct, error: sendAcctErr } = await supabase
    .from('send_accounts')
    .select('*, send_account_credentials(*), webauthn_credentials(*)')
    .single()
  if (sendAcctErr) {
    throw sendAcctErr
  }
  expect(sendAcct.init_code).toMatch(/\\x[a-f0-9]+$/i)
  expect(sendAcct.address).toMatch(/^0x[a-f0-9]{40}$/i)

  // verify account credential is created
  const acctCred = sendAcct.send_account_credentials[0]
  assert(!!acctCred, 'Missing account credential')
  expect(acctCred.key_slot).toBe(0)

  // verify webauthn credential
  const webAuthnCred = sendAcct.webauthn_credentials[0]
  assert(!!webAuthnCred, 'Missing webauthn credential')
  expect(webAuthnCred.display_name).toBe(acctName)
  expect(webAuthnCred.name).toBe(`${authSession.decoded.sub}.0`)
  expect(webAuthnCred.raw_credential_id).toBe(`\\x${credential.id.toString('hex')}`)
  assert(!!attestation, 'Missing credential attestation')
  expect(webAuthnCred.attestation_object).toBe(
    `\\x${Buffer.from(attestationObject).toString('hex')}`
  )
  const cborAttObj = cbor.decodeAllSync(attestationObject)[0]
  assert(!!cborAttObj, 'Missing cbor attestation object')
  const { authData } = cborAttObj as Attestation
  const { COSEPublicKey } = parseCredAuthData(authData)
  assert(!!COSEPublicKey, 'Missing COSEPublicKey')
  expect(webAuthnCred.public_key).toBe(`\\x${Buffer.from(COSEPublicKey).toString('hex')}`)

  // sponsor the creation by setting the balance using anvil
  await testBaseClient.setBalance({
    address: sendAcct.address,
    value: parseEther('1'),
  })

  // send user op
  await page.getByRole('button', { name: 'Send' }).click()

  // verify assertion
  const assertion = credential.assertions[0]
  assert(!!assertion, 'Missing credential assertion')

  await expect(page.getByLabel('Send result:')).toHaveValue('true')

  // verify receiver balance
  const receiverAddress = await page.getByRole('textbox', { name: 'Sending to:' }).inputValue()
  const ethAmount = await page.getByRole('textbox', { name: 'ETH Amount:' }).inputValue()

  const receiverBalance = await baseMainnetClient.getBalance({
    address: receiverAddress as Hex,
  })
  expect(receiverBalance.toString()).toBe(parseEther(ethAmount).toString())
})
