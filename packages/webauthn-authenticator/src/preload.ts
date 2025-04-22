/**
 * This file is loaded in the browser before the tests are run. It mocks the WebAuthn API and exposes a WebAuthnAuthenticator object on the window.
 */
import { base64urlnopad } from '@scure/base'
import type {
  CredentialCreationOptionsSerialized,
  CredentialRequestOptionsSerialized,
} from './types'

import * as utils from './utils'
import type { Authenticator } from './web-authenticator'
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
        challenge: base64urlnopad.encode(
          new Uint8Array(credOpt.publicKey.challenge as ArrayBuffer)
        ),
        user: {
          ...credOpt.publicKey.user,
          id: base64urlnopad.encode(new Uint8Array(credOpt.publicKey.user.id as ArrayBuffer)),
        },
        excludeCredentials: credOpt.publicKey.excludeCredentials?.map((c) => {
          return {
            ...c,
            id: base64urlnopad.encode(new Uint8Array(c.id as ArrayBuffer)),
          }
        }),
      },
    } as CredentialCreationOptionsSerialized

    const createCredFunc: InstanceType<typeof Authenticator>['createPublicKeyCredential'] =
      window[exposedCreateCredFuncName]
    if (!createCredFunc || typeof createCredFunc !== 'function') {
      throw new Error(`Missing ${exposedCreateCredFuncName} function. Did you forget to expose it?`)
    }

    const credSer = await createCredFunc(credOptSer)
    const cred = utils.deserializePublicKeyCredentialAttestion(credSer)
    return cred
  }
  navigator.credentials.get = async (credential: CredentialRequestOptions) => {
    if (!credential.publicKey) throw new Error('Missing publicKey in credentialOptions')
    if (!credential.publicKey.challenge) throw new Error('Missing challenge in publicKey')
    credential.publicKey.rpId = credential.publicKey.rpId ?? window.location.hostname

    const credOpts = {
      publicKey: {
        ...credential.publicKey,
        challenge: base64urlnopad.encode(
          new Uint8Array(credential.publicKey.challenge as ArrayBuffer)
        ),
        allowCredentials: credential.publicKey.allowCredentials?.map((c) => {
          return {
            ...c,
            id: base64urlnopad.encode(new Uint8Array(c.id as ArrayBuffer)),
          }
        }),
      },
    } as CredentialRequestOptionsSerialized

    const getCredFunc: InstanceType<typeof Authenticator>['getPublicKeyCredential'] =
      window[exposedGetCredFuncName]
    if (!getCredFunc || typeof getCredFunc !== 'function') {
      throw new Error(`Missing ${exposedGetCredFuncName} function. Did you forget to expose it?`)
    }

    const assertionSer = await getCredFunc(credOpts)
    const assertion = utils.deserializePublicKeyCredentialAssertion(assertionSer)
    return assertion
  }
}
