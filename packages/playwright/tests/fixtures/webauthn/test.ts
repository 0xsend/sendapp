import { test as base } from '@playwright/test'
import {
  installWebAuthnMock,
  createPublicKeyCredential,
  getPublicKeyCredential,
} from '@0xsend/webauthn-authenticator'
import debug from 'debug'

let log: debug.Debugger

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
