import { Tables } from '@my/supabase/database.types'
import { COSEECDHAtoXY } from '../passkeys'
import { base16 } from '@scure/base'
import { assert } from '../assert'

/**
 * Given a webauthn credential public key, return the public key as an X, Y pair.
 *
 * The webauthn credential public key is a COSE hex string.
 */
export function webauthnCredToXY(
  webauthnCred: Tables<'webauthn_credentials'> | { public_key: string }
) {
  const publicKeyHex = webauthnCred.public_key.slice(2).toUpperCase()
  assert(!!publicKeyHex, 'No publicKeyHex')
  const publicKey = COSEECDHAtoXY(base16.decode(publicKeyHex))
  assert(!!publicKey, 'No publicKey')
  return publicKey
}
