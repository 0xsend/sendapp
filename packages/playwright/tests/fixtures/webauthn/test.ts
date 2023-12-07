import { type BrowserContext, test as base, Page } from '@playwright/test'
import {
  CredentialsStore,
  createPublicKeyCredential,
  getPublicKeyCredential,
} from '@0xsend/webauthn-authenticator'
import { type WebAuthnAuthenticator } from '@0xsend/webauthn-authenticator'
import debug from 'debug'

let log: debug.Debugger

interface WebAuthnAuthenticatorWindow {
  WebAuthnAuthenticator?: typeof WebAuthnAuthenticator
}

export const test = base.extend<{
  context: BrowserContext
  page: Page
  credentialsStore: typeof CredentialsStore
}>({
  context: async ({ context }, use) => {
    log = debug(`test:fixtures:webauthn:${test.info().parallelIndex}`)

    log('context created')

    const exposedCreateCredFuncName = `__${createPublicKeyCredential.name}`
    const exposedGetCredFuncName = `__${getPublicKeyCredential.name}`

    log('exposing functions', {
      exposedCreateCredFuncName,
      exposedGetCredFuncName,
    })
    // TODO: just move all this to the preload script, handle crypto stuff there
    await context.exposeFunction(exposedCreateCredFuncName, createPublicKeyCredential)
    await context.exposeFunction(exposedGetCredFuncName, getPublicKeyCredential)

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
  // biome-ignore lint/correctness/noEmptyPattern: empty pattern is needed here
  credentialsStore: async ({}, use) => {
    await use(CredentialsStore)
  },
})
