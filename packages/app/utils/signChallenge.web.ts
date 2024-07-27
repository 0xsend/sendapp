import { signWithPasskey } from '@daimo/expo-passkeys'
import { sendAccountAbi } from '@my/wagmi'
import { type Hex, hexToBytes, bytesToHex, encodeAbiParameters, getAbiItem, isHex } from 'viem'
import { assert } from './assert'
import { parseSignResponse, parseAndNormalizeSig } from './passkeys'

/**
 * Signs a challenge using the user's passkey and returns the signature in a format that matches the ABI of a signature
 * struct for the SendVerifier contract.
 * @param challenge - The challenge to sign encoded as a 0x-prefixed hex string.
 * @param rawIdsB64 - The list of raw ids to use for signing. Required for Android and Chrome.
 * @returns The signature in a format that matches the ABI of a signature struct for the SendVerifier contract.
 */
export async function signChallenge(
  challenge: Hex,
  allowedCredentials: { id: string; userHandle: string }[]
): Promise<{
  keySlot: number
  accountName: string
  encodedWebAuthnSig: Hex
}> {
  const challengeBytes = hexToBytes(challenge)
  const challengeB64 = Buffer.from(challengeBytes).toString('base64')
  const sign = await signWithPasskey({
    domain: window.location.hostname,
    challengeB64,
    rawIdsB64: allowedCredentials.map(({ id }) => id), // pass the raw ids to the authenticator
  })
  // handle if a non-resident passkey is used so no userHandle is returned
  sign.passkeyName =
    sign.passkeyName ?? allowedCredentials.find(({ id }) => id === sign.id)?.userHandle ?? ''
  assert(!!sign.passkeyName, 'No passkey name found')
  const signResult = parseSignResponse(sign)
  const clientDataJSON = signResult.clientDataJSON
  const authenticatorData = bytesToHex(signResult.rawAuthenticatorData)
  const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'))
  const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'))
  const { r, s } = parseAndNormalizeSig(signResult.derSig)
  const webauthnSig = {
    authenticatorData,
    clientDataJSON,
    challengeLocation,
    responseTypeLocation,
    r,
    s,
  }

  const encodedWebAuthnSig = encodeAbiParameters(
    getAbiItem({
      abi: sendAccountAbi,
      name: 'signatureStruct',
    }).inputs,
    [webauthnSig]
  )
  assert(isHex(encodedWebAuthnSig), 'Invalid encodedWebAuthnSig')

  // @todo: verify signature with user's identifier to ensure it's the correct passkey
  // const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
  // const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
  // newEncodedWebAuthnSigBytes[0] = keySlot
  // newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)
  // const verified = await verifySignature(challenge, bytesToHex(newEncodedWebAuthnSigBytes), [
  //   '0x5BCEE51E9210DAF159CC89BCFDA7FF0AE8AF0881A67D91082503BA90106878D0',
  //   '0x02CC25B94834CD8214E579356848281F286DD9AED9E5E4D7DD58353990ADD661',
  // ])
  // console.log('verified', verified)
  return {
    keySlot: signResult.keySlot,
    accountName: signResult.accountName,
    encodedWebAuthnSig,
  }
}
