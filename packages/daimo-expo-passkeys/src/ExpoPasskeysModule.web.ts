/// <reference lib="dom" />

import type {
  PublicKeyCredential,
  PublicKeyCredentialCreationOptions,
  PublicKeyCredentialRequestOptions,
} from '@simplewebauthn/typescript-types'

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; ++i) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const ExpoPasskeysModuleWeb = {
  async createPasskey(
    domain: string,
    accountName: string,
    userIdBase64: string,
    challengeBase64: string
  ): Promise<string> {
    const userId = base64ToArrayBuffer(userIdBase64)
    const challenge = base64ToArrayBuffer(challengeBase64)

    // Prepare PublicKeyCredentialCreationOptions for WebAuthn
    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: {
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
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
    } as PublicKeyCredentialCreationOptions

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential

    console.debug('credential', credential)

    return arrayBufferToBase64(credential.rawId)
  },

  async signWithPasskey(
    domain: string,
    challengeBase64: string
  ): Promise<{
    passkeyName: string
    signature: string
    rawAuthenticatorData: string
    rawClientDataJSON: string
  }> {
    const challenge = base64ToArrayBuffer(challengeBase64)

    // Prepare PublicKeyCredentialRequestOptions for WebAuthn
    const publicKeyCredentialRequestOptions = {
      challenge,
      rpId: domain,
    } as PublicKeyCredentialRequestOptions

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential & {
      response: AuthenticatorAssertionResponse
    }

    console.debug('assertion', assertion)

    // Extracting various parts of the assertion
    const decoder = new TextDecoder('utf-8')
    const signature = arrayBufferToBase64(assertion.response.signature)
    const rawAuthenticatorData = arrayBufferToBase64(assertion.response.authenticatorData)
    const rawClientDataJSON = arrayBufferToBase64(assertion.response.clientDataJSON)
    const passkeyName = decoder.decode(assertion.response.userHandle as ArrayBuffer)

    return {
      passkeyName,
      signature,
      rawAuthenticatorData,
      rawClientDataJSON,
    }
  },
}

export default ExpoPasskeysModuleWeb
