/// <reference lib="dom" />

import { base64, base64urlnopad } from '@scure/base'

/**
 * Check if WebAuthn is available.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-sample-registration
 */
function checkPasskeyAvailableOrThrow() {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not available')
  }
  return true
}

const ExpoPasskeysModuleWeb = {
  async createPasskey(
    domain: string,
    accountName: string,
    userIdBase64: string,
    challengeBase64: string
  ): Promise<{
    credentialID: string
    rawClientDataJSON: string
    rawAttestationObject: string
  }> {
    checkPasskeyAvailableOrThrow()

    const userId = base64.decode(userIdBase64)
    const challenge = base64.decode(challengeBase64)

    // Prepare PublicKeyCredentialCreationOptions for WebAuthn
    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        id: domain,
        name: domain,
      },
      user: {
        id: userId,
        name: accountName,
        displayName: accountName,
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7, // "ES256" IANA COSE Algorithms registry
        },
      ],
      authenticatorSelection: {
        userVerification: 'required',
        requireResidentKey: true,
      },
    } as PublicKeyCredentialCreationOptions

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential & {
      response: AuthenticatorAttestationResponse
    }

    return {
      credentialID: base64.encode(new Uint8Array(credential.rawId)),
      rawClientDataJSON: base64.encode(new Uint8Array(credential.response.clientDataJSON)),
      rawAttestationObject: base64.encode(new Uint8Array(credential.response.attestationObject)),
    }
  },

  async signWithPasskey(
    domain: string,
    challengeBase64: string,
    rawIdsB64: string[]
  ): Promise<{
    id: string
    passkeyName: string | null
    signature: string
    rawAuthenticatorDataB64: string
    rawClientDataJSONB64: string
  }> {
    checkPasskeyAvailableOrThrow()

    const challenge = base64.decode(challengeBase64)

    // Prepare PublicKeyCredentialRequestOptions for WebAuthn
    const publicKeyCredentialRequestOptions = {
      challenge,
      rpId: domain,
      userVerification: 'required',
      allowCredentials: rawIdsB64.map((rawIdB64) => ({
        id: base64.decode(rawIdB64),
        type: 'public-key',
      })),
    } as PublicKeyCredentialRequestOptions

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential & {
      response: AuthenticatorAssertionResponse
    }

    // Extracting various parts of the assertion
    const decoder = new TextDecoder('utf-8')
    const signature = base64.encode(new Uint8Array(assertion.response.signature))
    const rawAuthenticatorDataB64 = base64.encode(
      new Uint8Array(assertion.response.authenticatorData)
    )
    const rawClientDataJSONB64 = base64.encode(new Uint8Array(assertion.response.clientDataJSON))
    const passkeyName = assertion.response.userHandle
      ? decoder.decode(assertion.response.userHandle as ArrayBuffer)
      : null
    const id = base64.encode(base64urlnopad.decode(assertion.id))

    return {
      id,
      passkeyName,
      signature,
      rawAuthenticatorDataB64,
      rawClientDataJSONB64,
    }
  },
}

export default ExpoPasskeysModuleWeb
