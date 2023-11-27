import { test as base } from '@playwright/test'
import crypto from 'crypto'
import { base64url } from '@scure/base'
import debug from 'debug'

let log: debug.Debugger

declare global {
  interface Window {
    mockNavigatorCredentialsCreate: (
      credentialOptions: CredentialCreationOptionsSerialized
    ) => Promise<PublicKeyCredentialSerialized>
    mockCredentialsGet: (credential: CredentialRequestOptions) => Promise<PublicKeyCredential>
  }
}
interface PublicKeyCredentialUserEntitySerialized
  extends Omit<PublicKeyCredentialUserEntity, 'id'> {
  id: string
}
interface PublicKeyCredentialCreationOptionsSerialized
  extends Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'user'> {
  challenge: string
  user: PublicKeyCredentialUserEntitySerialized
}
export type CredentialCreationOptionsSerialized = {
  publicKey: PublicKeyCredentialCreationOptionsSerialized
}
interface AuthenticatorAttestationResponseSerialized
  extends Omit<AuthenticatorAttestationResponse, 'clientDataJSON' | 'attestationObject'> {
  clientDataJSON: string
  attestationObject: string
}
interface PublicKeyCredentialSerialized extends Omit<PublicKeyCredential, 'response' | 'rawId'> {
  response: AuthenticatorAttestationResponseSerialized
  rawId: string
}
/**
 * Mock the navigator.credentials.create API.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-createCredential
 */
async function mockNavigatorCredentialsCreate(
  credentialOptions: CredentialCreationOptionsSerialized
): Promise<PublicKeyCredentialSerialized> {
  log('mockNavigatorCredentialsCreate', credentialOptions)

  const challenge = base64url.decode(credentialOptions.publicKey.challenge)
  const credentialId: Buffer = crypto.randomBytes(16)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'sec1', format: 'pem' },
  })

  const clientDataJSON = base64url.encode(
    new TextEncoder().encode(
      JSON.stringify({
        challenge: base64url.encode(challenge),
        origin: credentialOptions.publicKey.rp.name,
        type: 'webauthn.create',
      })
    )
  )

  // TODO: Implement attestationObject
  const attestationObject = base64url.encode(new Uint8Array(new ArrayBuffer(16)))

  // Mock PublicKeyCredential
  return {
    id: credentialId.toString('base64'),
    rawId: credentialId.toString('base64'),
    authenticatorAttachment: 'platform',
    response: {
      attestationObject,
      clientDataJSON,
    },
    type: 'public-key',
  } as PublicKeyCredentialSerialized
}
const mockCredentialsGet = async (credential: CredentialRequestOptions) => {
  return {
    rawId: new ArrayBuffer(16),
  } as PublicKeyCredential
}

export const test = base.extend({
  context: async ({ context }, use) => {
    log = debug(`test:fixtures:webauthn:${test.info().parallelIndex}`)

    await context.exposeFunction('mockNavigatorCredentialsCreate', mockNavigatorCredentialsCreate)
    await context.exposeFunction('mockCredentialsGet', mockCredentialsGet)

    await context.addInitScript(() => {
      console.log('webauthn mock init script')

      // Add helpers to convert ArrayBuffer to base64
      function arrayBufferToBase64(buffer: ArrayBuffer) {
        let binary = ''
        const bytes = new Uint8Array(buffer)
        for (let i = 0; i < bytes.byteLength; ++i) {
          binary += String.fromCharCode(bytes[i] as number)
        }
        return window.btoa(binary)
      }

      function base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes.buffer as ArrayBuffer
      }

      // Mock the WebAuthn API
      navigator.credentials.create = async (credOpt: CredentialCreationOptions) => {
        console.log('webauthn mock create credential', credOpt)

        if (!credOpt.publicKey) throw new Error('Missing publicKey in credentialOptions')
        if (!credOpt.publicKey.challenge) throw new Error('Missing challenge in publicKey')
        if (!credOpt.publicKey.rp) throw new Error('Missing rp in publicKey')
        if (!credOpt.publicKey.rp.id) throw new Error('Missing rp.id in publicKey')
        if (!credOpt.publicKey.user) throw new Error('Missing user in publicKey')

        const credOptSer = {
          publicKey: {
            ...credOpt.publicKey,
            challenge: arrayBufferToBase64(credOpt.publicKey.challenge as ArrayBuffer),
            user: {
              ...credOpt.publicKey.user,
              id: arrayBufferToBase64(credOpt.publicKey.user.id as ArrayBuffer),
            },
            excludeCredentials: credOpt.publicKey.excludeCredentials?.map((c) => {
              return {
                ...c,
                id: arrayBufferToBase64(c.id as ArrayBuffer),
              }
            }),
          },
        } as CredentialCreationOptionsSerialized

        console.log('webauthn mock create credentialSerialized', credOptSer)

        const credSer = await window.mockNavigatorCredentialsCreate(credOptSer)

        console.log('webauthn mock create credSer', credSer)

        const cred = {
          ...credSer,
          rawId: base64ToArrayBuffer(credSer.rawId),
          response: {
            ...credSer.response,
            clientDataJSON: base64ToArrayBuffer(credSer.response.clientDataJSON),
            attestationObject: base64ToArrayBuffer(credSer.response.attestationObject),
          },
        }

        console.log('mocked! create cred', cred)

        return cred
      }
      navigator.credentials.get = async (credential: CredentialRequestOptions) => {
        // biome-ignore lint/suspicious/noExplicitAny: any since we're mocking the API
        return await (window as any).mockCredentialsGet(credential)
      }
    })

    await use(context)
  },
})
