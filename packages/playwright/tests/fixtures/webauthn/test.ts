import {
  Authenticator,
  type CredentialCreationOptionsSerialized,
  type CredentialRequestOptionsSerialized,
} from '@0xsend/webauthn-authenticator'
import type { WebAuthnAuthenticator } from '@0xsend/webauthn-authenticator'
import { type BrowserContext, type Page, test as base } from '@playwright/test'
import debug from 'debug'

let log: debug.Debugger

interface WebAuthnAuthenticatorWindow {
  WebAuthnAuthenticator?: typeof WebAuthnAuthenticator
}

// TODO: add a detereministic seed for the credential store
export const test = base.extend<{
  authenticator: Authenticator
  context: BrowserContext
  page: Page
}>({
  // biome-ignore lint/correctness/noEmptyPattern: empty pattern is required for test.extend
  authenticator: ({}, use) => {
    const authenticator = new Authenticator()
    return use(authenticator)
  },
  context: async ({ context, authenticator }, use) => {
    log = debug(`test:fixtures:webauthn:${test.info().parallelIndex}`)

    log('context created')

    const exposedCreateCredFuncName = `__${authenticator.createPublicKeyCredential.name}`
    const exposedGetCredFuncName = `__${authenticator.getPublicKeyCredential.name}`

    log('exposing functions', {
      exposedCreateCredFuncName,
      exposedGetCredFuncName,
    })

    await context.exposeFunction(
      exposedCreateCredFuncName,
      async (args: CredentialCreationOptionsSerialized) =>
        authenticator.createPublicKeyCredential(args)
    )
    await context.exposeFunction(
      exposedGetCredFuncName,
      async (args: CredentialRequestOptionsSerialized) => authenticator.getPublicKeyCredential(args)
    )

    log('adding init script: preload.js', {
      path: require.resolve('@0xsend/webauthn-authenticator/dist/preload.js'),
    })
    await context.addInitScript({
      path: require.resolve('@0xsend/webauthn-authenticator/dist/preload.js'),
    })

    log('adding init script: installWebAuthnMock')
    await context.addInitScript(
      ({ exposedCreateCredFuncName, exposedGetCredFuncName }) => {
        const { WebAuthnAuthenticator } = window as WebAuthnAuthenticatorWindow

        if (!WebAuthnAuthenticator) {
          throw new Error('Missing WebAuthenticator. Did you forget to add an init script?')
        }

        WebAuthnAuthenticator.installWebAuthnMock({
          exposedCreateCredFuncName,
          exposedGetCredFuncName,
        })
      },
      {
        exposedCreateCredFuncName,
        exposedGetCredFuncName,
      }
    )

    await use(context)
  },
  page: async ({ context }, use) => {
    const page = await context.newPage()

    log('page created')

    // ensure WebAuthnAuthenticator is available
    await page.waitForFunction(
      () => {
        return (
          (window as WebAuthnAuthenticatorWindow).WebAuthnAuthenticator?.installWebAuthnMock !==
          undefined
        )
      },
      {
        timeout: 1000,
      }
    )

    await use(page)
  },
})
