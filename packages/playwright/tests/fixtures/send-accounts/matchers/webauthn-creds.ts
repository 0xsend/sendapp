import type { Authenticator } from '@0xsend/webauthn-authenticator'
import { parseCredAuthData } from '@0xsend/webauthn-authenticator/utils'
import type { Database } from '@my/supabase/database-generated.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assert } from 'app/utils/assert'
import { hexToPgBase16 } from 'app/utils/hexToPgBase16'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { byteaToHex } from 'app/utils/byteaToHex'
import { withRetry, checksumAddress } from 'viem'
import cbor from 'cbor'
import { expect } from '@playwright/test'

expect.extend({
  /**
   * Given a user authencated supabase client and an authenticator, asserts that the authenticator credentials
   * are associated with the send account.
   *
   * Valid here means that the credential is correctly stored in the database and the signing key is added to the account.
   * It requires the shovel integration to be running in order to have the `send_account_signing_key_added` table populated.
   */
  async toHaveValidWebAuthnCredentials(
    supabase: SupabaseClient<Database>,
    authenticator: Authenticator
  ) {
    const { data: sendAcct, error: sendAcctErr } = await supabase
      .from('send_accounts')
      .select('*,send_account_credentials(*),webauthn_credentials(*)')
      .single()
    assert(!sendAcctErr, `Error fetching send account: ${sendAcctErr?.message}`)

    const credentials = authenticator.credentials
    expect(Object.values(credentials).length).toBe(sendAcct.webauthn_credentials.length)

    for (const [index, credential] of Object.values(credentials).entries()) {
      expect(
        credential.attestations.length,
        `Expected 1 attestation for credential at index ${index}`
      ).toBe(1)

      const attestation = credential.attestations[0]
      assert(!!attestation, `Missing attestation for credential at index ${index}`)

      const { attestationObject } = attestation
      assert(!!attestationObject, `Missing attestationObject for credential at index ${index}`)

      const webAuthnCred = sendAcct.webauthn_credentials.find(
        (c) => c.raw_credential_id === `\\x${credential.id.toString('hex')}`
      )
      assert(!!webAuthnCred, `Missing WebAuthn credential at index ${index}`)
      const sendAcctCred = sendAcct.send_account_credentials.find(
        (c) => c.credential_id === webAuthnCred.id
      )
      assert(!!sendAcctCred, `Missing send account credential at index ${index}`)

      expect(webAuthnCred.name, `Missing name for credential at index ${index}`).toBe(
        `${sendAcct.user_id}.${sendAcctCred.key_slot}`
      )
      expect(
        webAuthnCred.raw_credential_id,
        `Missing raw_credential_id for credential at index ${index}`
      ).toBe(`\\x${credential.id.toString('hex')}`)
      expect(webAuthnCred.attestation_object).toBe(
        `\\x${Buffer.from(attestationObject).toString('hex')}`
      )

      const cborAttObj = cbor.decodeAllSync(attestationObject)[0]
      assert(!!cborAttObj, `Missing CBOR attestation object for credential at index ${index}`)

      const { authData } = cborAttObj
      const { COSEPublicKey: COSEPublicKeyBytes } = parseCredAuthData(authData)
      assert(
        !!COSEPublicKeyBytes && COSEPublicKeyBytes.length > 0,
        `Missing COSEPublicKey for credential at index ${index}`
      )

      const COSEPublicKey = Buffer.from(COSEPublicKeyBytes).toString('hex')
      expect(webAuthnCred.public_key, `Missing public_key for credential at index ${index}`).toBe(
        `\\x${COSEPublicKey}`
      )
      const [xHex, yHex] = COSEECDHAtoXY(COSEPublicKeyBytes)
      const xPgB16 = hexToPgBase16(xHex)
      const yPgB16 = hexToPgBase16(yHex)

      // retry until signing key is added to the account
      const keyAdded = await withRetry(
        async () => {
          const { data: keyAdded, error: keyAddedErr } = await supabase
            .from('send_account_signing_key_added')
            .select('account, key_slot, key')
            .in('key', [xPgB16, yPgB16])
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
      expect(keyAdded.length, `Missing key added for credential at index ${index}`).toBe(2)
      expect(keyAdded[0]?.key_slot, `Missing key_slot for credential at index ${index}`).toBe(
        sendAcctCred.key_slot
      )
      expect(keyAdded[0]?.key, `Missing X key for credential at index ${index}`).toBe(xPgB16)
      expect(keyAdded[1]?.key_slot, `Missing key_slot for credential at index ${index}`).toBe(
        sendAcctCred.key_slot
      )
      expect(keyAdded[1]?.key, `Missing Y key for credential at index ${index}`).toBe(yPgB16)
      const account = checksumAddress(sendAcct.address as `0x${string}`)
      expect(account, `Missing account for credential at index ${index}`).toBe(
        checksumAddress(byteaToHex(keyAdded[0]?.account as `\\x${string}`))
      )
      expect(account, `Missing account for credential at index ${index}`).toBe(
        checksumAddress(byteaToHex(keyAdded[1]?.account as `\\x${string}`))
      )
    }

    return {
      pass: true,
      message: () => 'All credentials are associated correctly with the send account',
    }
  },
})

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      /**
       * Given a user authencated supabase client and an authenticator, asserts that the authenticator credentials
       * are associated with the send account.
       *
       * Valid here means that the credential is correctly stored in the database and the signing key is added to the account.
       * It requires the shovel integration to be running in order to have the `send_account_signing_key_added` table populated.
       */
      toHaveValidWebAuthnCredentials(authenticator: Authenticator): Promise<R>
    }
  }
}
