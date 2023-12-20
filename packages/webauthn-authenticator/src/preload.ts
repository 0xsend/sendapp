/**
 * This file is loaded in the browser before the tests are run. It mocks the WebAuthn API and exposes a WebAuthnAuthenticator object on the window.
 */
import * as utils from './utils'
import type {
  CredentialCreationOptionsSerialized,
  CredentialRequestOptionsSerialized,
} from './types'
import { type createPublicKeyCredential, type getPublicKeyCredential } from './web-authenticator'

export { utils }

/**
 * Install the WebAuthn authenticator mock in the browser. This is a helper function to be used in Playwright tests.
 */
export function installWebAuthnMock({
  exposedCreateCredFuncName,
  exposedGetCredFuncName,
}: {
  exposedCreateCredFuncName?: string
  exposedGetCredFuncName?: string
} = {}) {
  if (!exposedCreateCredFuncName) {
    throw new Error('Missing exposedCreateCredFuncName. Did you forget to expose it?')
  }
  if (!exposedGetCredFuncName) {
    throw new Error('Missing exposedGetCredFuncName. Did you forget to expose it?')
  }

  console.log('webauthn mock init script')

  // Mock the WebAuthn API
  navigator.credentials.create = async (credOpt: CredentialCreationOptions) => {
    console.log('webauthn mock create credential', credOpt)

    if (!credOpt.publicKey) throw new Error('Missing publicKey in credentialOptions')
    if (!credOpt.publicKey.challenge) throw new Error('Missing challenge in publicKey')
    if (!credOpt.publicKey.rp || !credOpt.publicKey.rp.id) {
      credOpt.publicKey.rp = {
        ...credOpt.publicKey.rp,
        id: window.location.hostname,
      }
    }

    if (!credOpt.publicKey.user) throw new Error('Missing user in publicKey')

    const credOptSer = {
      publicKey: {
        ...credOpt.publicKey,
        challenge: Buffer.from(credOpt.publicKey.challenge as ArrayBuffer).toString('base64'),
        user: {
          ...credOpt.publicKey.user,
          id: Buffer.from(credOpt.publicKey.user.id as ArrayBuffer).toString('base64'),
        },
        excludeCredentials: credOpt.publicKey.excludeCredentials?.map((c) => {
          return {
            ...c,
            id: Buffer.from(c.id as ArrayBuffer).toString('base64'),
          }
        }),
      },
    } as CredentialCreationOptionsSerialized

    console.log('[webauthn mock] create credentialSerialized', credOptSer)

    // biome-ignore lint/suspicious/noExplicitAny: explicit any is needed here
    const createCredFunc: typeof createPublicKeyCredential = (window as any)[
      exposedCreateCredFuncName
    ]
    if (!createCredFunc || typeof createCredFunc !== 'function') {
      throw new Error(`Missing ${exposedCreateCredFuncName} function. Did you forget to expose it?`)
    }

    const credSer = await createCredFunc(credOptSer)

    console.log('[webauthn mock] create credSer', credSer)

    const cred = utils.deserializePublicKeyCredentialAttestion(credSer)

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
        challenge: Buffer.from(credential.publicKey.challenge as ArrayBuffer).toString('base64'),
        allowCredentials: credential.publicKey.allowCredentials?.map((c) => {
          return {
            ...c,
            id: Buffer.from(c.id as ArrayBuffer).toString('base64'),
          }
        }),
      },
    } as CredentialRequestOptionsSerialized

    // biome-ignore lint/suspicious/noExplicitAny: explicit any is needed here
    const getCredFunc: typeof getPublicKeyCredential = (window as any)[exposedGetCredFuncName]
    if (!getCredFunc || typeof getCredFunc !== 'function') {
      throw new Error(`Missing ${exposedGetCredFuncName} function. Did you forget to expose it?`)
    }

    const assertionSer = await getCredFunc(credOpts)

    console.debug('[webauthn mock] assertion', assertionSer)

    const assertion = utils.deserializePublicKeyCredentialAssertion(assertionSer)

    return assertion
  }
}
