/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { test, expect } from './fixtures/auth'

test('can visit onboarding page', async ({ page }) => {
  await page.goto('/')
  expect(page).toHaveURL('/')
  await page.getByRole('button', { name: 'Create' }).click()
  await page.pause()
})
