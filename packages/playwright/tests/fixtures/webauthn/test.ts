import { test as base } from '@playwright/test'
import { createPublicKeyCredential, getPublicKeyCredential } from '@0xsend/webauthn-authenticator'
import debug from 'debug'

let log: debug.Debugger

interface WebAuthnAuthenticatorWindow {
  WebAuthnAuthenticator?: typeof import('@0xsend/webauthn-authenticator/preload')
}

export const test = base.extend({
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

    log('adding init script: preload.js')
    await context.addInitScript({
      path: '/Users/allen/0xbigboss/0xsend/sendapp/packages/webauthn-authenticator/dist/preload.js',
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
})
