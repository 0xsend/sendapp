import { test as base } from '@playwright/test'
import {
  type CredentialCreationOptionsSerialized,
  type CredentialRequestOptionsSerialized,
  type PublicKeyCredentialAssertionSerialized,
  type PublicKeyCredentialAttestationSerialized,
  createPublicKeyCredential,
  getPublicKeyCredential,
} from '@0xsend/webauthn-authenticator'
import debug from 'debug'

let log: debug.Debugger

/**
 * Install the WebAuthn authenticator mock in the browser. This is a helper function to be used in Playwright tests.
 */
function installWebAuthnMock({
  createCredFuncName = createPublicKeyCredential.name,
  getCredFuncName = getPublicKeyCredential.name,
}) {
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

    // biome-ignore lint/suspicious/noExplicitAny: explicit any is needed here
    const createCredFunc: typeof createPublicKeyCredential = (window as any)[createCredFuncName]
    if (!createCredFunc || typeof createCredFunc !== 'function') {
      throw new Error(`Missing ${createCredFuncName} function. Did you forget to expose it?`)
    }

    const credSer: PublicKeyCredentialAttestationSerialized = await createCredFunc(credOptSer)

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
    console.log('[webauthn mock] get credential', credential)

    if (!credential.publicKey) throw new Error('Missing publicKey in credentialOptions')
    if (!credential.publicKey.challenge) throw new Error('Missing challenge in publicKey')
    if (!credential.publicKey.rpId) throw new Error('Missing rpId in publicKey')

    const credOpts = {
      publicKey: {
        ...credential.publicKey,
        challenge: arrayBufferToBase64(credential.publicKey.challenge as ArrayBuffer),
        allowCredentials: credential.publicKey.allowCredentials?.map((c) => {
          return {
            ...c,
            id: arrayBufferToBase64(c.id as ArrayBuffer),
          }
        }),
      },
    } as CredentialRequestOptionsSerialized

    // biome-ignore lint/suspicious/noExplicitAny: explicit any is needed here
    const getCredFunc: typeof getPublicKeyCredential = (window as any)[getCredFuncName]
    if (!getCredFunc || typeof getCredFunc !== 'function') {
      throw new Error(`Missing ${getCredFuncName} function. Did you forget to expose it?`)
    }

    const assertion = await getCredFunc(credOpts)

    console.debug('[webauthn mock] assertion', assertion)
    return assertion
  }
}

export const test = base.extend({
  context: async ({ context }, use) => {
    log = debug(`test:fixtures:webauthn:${test.info().parallelIndex}`)

    const exposedCreateCredFuncName = `__${createPublicKeyCredential.name}`
    const exposedGetCredFuncName = `__${getPublicKeyCredential.name}`

    await context.exposeFunction(exposedCreateCredFuncName, createPublicKeyCredential)
    await context.exposeFunction(exposedGetCredFuncName, getPublicKeyCredential)

    await context.addInitScript(
      installWebAuthnMock.bind(null, {
        createCredFuncName: exposedCreateCredFuncName,
        getCredFuncName: exposedGetCredFuncName,
      })
    )

    await use(context)
  },
})
