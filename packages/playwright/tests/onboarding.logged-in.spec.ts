/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { test, expect } from './fixtures/auth'
import debug from 'debug'

let log: debug.Debugger | undefined

test.beforeEach(async ({ page }) => {
  log = debug(`test:onboarding:logged-in:${test.info().parallelIndex}`)
  await page.addInitScript(() => {
    console.log('Hello from the browser')
    console.log(navigator.credentials)
    // Mock the WebAuthn API
    // full example [here](https://github.com/artifact-project/webauthn/blob/master/autotest-example/utils/webauthn.ts)
    navigator.credentials.create = async (credential: CredentialCreationOptions) => {
      console.log('mocked!')
      return {
        rawId: new ArrayBuffer(16),
      } as PublicKeyCredential
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
