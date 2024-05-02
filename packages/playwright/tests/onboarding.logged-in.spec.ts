/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import type { Attestation } from '@0xsend/webauthn-authenticator/types'
import { parseCredAuthData } from '@0xsend/webauthn-authenticator/utils'
import { assert } from 'app/utils/assert'
import cbor from 'cbor'

import { expect, test } from './fixtures/auth'
import { OnboardingPage } from './fixtures/send-accounts'
import { hexToPgBase16 } from 'app/utils/hexToPgBase16'
import { checksumAddress, withRetry } from 'viem'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { pgBase16ToHex } from 'app/utils/pgBase16ToHex'

test('can visit onboarding page', async ({ page, supabase, authSession, authenticator }) => {
  const onboardingPage = new OnboardingPage(page)
  await onboardingPage.completeOnboarding(expect)

  // assert passkey was created
  const credentials = authenticator.credentials
  expect(Object.values(credentials).length).toBe(1)
  const credential = Object.values(credentials)[0]
  assert(!!credential, 'Missing credential')
  expect(credential.attestations.length).toBe(1)

  const attestation = credential.attestations[0]
  assert(!!attestation, 'Missing credential attestation')

  const { clientDataJSON, attestationObject } = attestation
  assert(!!clientDataJSON && !!attestationObject, 'Missing clientDataJSON or attestationObject')

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
  expect(webAuthnCred.display_name).toBe(onboardingPage.accountName)
  expect(webAuthnCred.name).toBe(`${authSession.decoded.sub}.0`)
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

  // retry until signing key is added to the account
  const keyAdded = await withRetry(
    async () => {
      const { data: keyAdded, error: keyAddedErr } = await supabase
        .from('send_account_signing_key_added')
        .select('account, key_slot, key')
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
  const [x, y] = COSEECDHAtoXY(COSEPublicKeyBytes)
  expect(keyAdded[0]?.key_slot).toBe(0)
  expect(keyAdded[0]?.key).toBe(hexToPgBase16(x))
  expect(keyAdded[1]?.key).toBe(hexToPgBase16(y))
  const account = checksumAddress(pgBase16ToHex(keyAdded[0]?.account as `\\x${string}`))
  expect(account).toBe(checksumAddress(sendAcct.address))
})
