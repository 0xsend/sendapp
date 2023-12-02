/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { test, expect } from './fixtures/auth'

test('can visit onboarding page', async ({ page, credentialsStore }) => {
  await page.goto('/')
  expect(page).toHaveURL('/')
  await page.getByRole('button', { name: 'Create' }).click()

  // assert passkey was created
  console.log('credentialsStore', credentialsStore)
  expect(Object.values(credentialsStore).length).toBe(1)

  await page.getByRole('button', { name: 'Sign' }).click()

  // verify signature
})
