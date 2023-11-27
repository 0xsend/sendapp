/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { test, expect } from './fixtures/auth'
import debug from 'debug'
import crypto from 'crypto'
import { base64 } from '@scure/base'

let log: debug.Debugger | undefined

declare global {
  interface Window {
    mockNavigatorCredentialsCreate: (
      credentialOptions: CredentialCreationOptionsSerialized
    ) => Promise<PublicKeyCredentialSerialized>
    mockCredentialsGet: (credential: CredentialRequestOptions) => Promise<PublicKeyCredential>
  }
}

// TODO: move to a fixture instead of file-scoped
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1', // same that P-256 curve
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'sec1', format: 'pem' },
})

/**
 * Create a mock authenticator data buffer.
 */
function createMockAuthenticatorData(rpId: string, userHandle: ArrayBuffer): ArrayBuffer {
  const rpIdHash = crypto.createHash('SHA256').update(rpId).digest()
  const flags = Buffer.from([0x01]) // User Present (UP) flag set
  const signCount = Buffer.alloc(4)
  signCount.writeUInt32BE(1)

  // Combine all parts
  return Buffer.concat([rpIdHash, flags, signCount, Buffer.from(userHandle)])
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

type CredentialCreationOptionsSerialized = {
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

// The mock function for navigator.credentials.create
async function mockNavigatorCredentialsCreate(
  credentialOptions: CredentialCreationOptionsSerialized
): Promise<PublicKeyCredentialSerialized> {
  if (!credentialOptions.publicKey) throw new Error('Missing publicKey in credentialOptions')
  if (!credentialOptions.publicKey.challenge) throw new Error('Missing challenge in publicKey')
  if (!credentialOptions.publicKey.rp) throw new Error('Missing rp in publicKey')
  if (!credentialOptions.publicKey.rp.id) throw new Error('Missing rp.id in publicKey')
  if (!credentialOptions.publicKey.user) throw new Error('Missing user in publicKey')

  const challenge = base64.decode(credentialOptions.publicKey.challenge)
  const rpId = credentialOptions.publicKey.rp.id
  const userHandle = base64.decode(credentialOptions.publicKey.user.id)

  log?.('mockNavigatorCredentialsCreate', credentialOptions)

  const userHandleBuffer = Buffer.from(userHandle as ArrayBuffer)

  // Mock authenticator data
  const authenticatorData = createMockAuthenticatorData(rpId, userHandleBuffer)

  // Mock clientDataJSON
  const clientDataJSON = JSON.stringify({
    challenge: Buffer.from(challenge as ArrayBuffer).toString('base64'),
    origin: 'http://localhost:3000',
    type: 'webauthn.create',
  })

  // Mock signature
  const signature = crypto
    .createSign('SHA256')
    .update(Buffer.concat([Buffer.from(authenticatorData), Buffer.from(clientDataJSON)]))
    .sign(privateKey)

  // Mock PublicKeyCredential
  return {
    id: 'mockCredentialId',
    rawId: base64.encode(userHandle),
    authenticatorAttachment: 'platform',
    response: {
      attestationObject: base64.encode(new Uint8Array(new ArrayBuffer(16))), // TODO: generate a real attestation object based on the challenge with the private key
      clientDataJSON: base64.encode(new TextEncoder().encode(clientDataJSON)),
    },
    type: 'public-key',
  } as PublicKeyCredentialSerialized
}

const mockCredentialsGet = async (credential: CredentialRequestOptions) => {
  log?.('mocked! get')
  return {
    rawId: new ArrayBuffer(16),
  } as PublicKeyCredential
}

test.beforeEach(async ({ page }) => {
  log = debug(`test:onboarding:logged-in:${test.info().parallelIndex}`)

  log('beforeEach', `url=${page.url()}`)

  await page.exposeFunction('mockNavigatorCredentialsCreate', mockNavigatorCredentialsCreate)
  await page.exposeFunction('mockCredentialsGet', mockCredentialsGet)

  await page.addInitScript(() => {
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
    // full example [here](https://github.com/artifact-project/webauthn/blob/master/autotest-example/utils/webauthn.ts)
    navigator.credentials.create = async (credOpt: CredentialCreationOptions) => {
      console.log('mocked! create credential', credOpt)

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

      console.log('mocked! create credentialSerialized', credOptSer)

      const credSer = await window.mockNavigatorCredentialsCreate(credOptSer)

      console.log('mocked! create credSer', credSer)

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
  log('beforeEach', `url=${page.url()}`)
})

test('can visit onboarding page', async ({ page }) => {
  await page.goto('/')
  expect(page).toHaveURL('/')
  await page.getByRole('button', { name: 'Create' }).click()
  await page.pause()
})
