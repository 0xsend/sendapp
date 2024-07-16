import { expect, mergeTests } from '@playwright/test'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { test as webauthnTest } from '@my/playwright/fixtures/webauthn'
import debug from 'debug'
import { signUp } from './fixtures/send-accounts'

let log: debug.Debugger

const test = mergeTests(snapletTest, webauthnTest)

test.beforeEach(async ({ page }) => {
  log = debug(`test:sign-in:${test.info().parallelIndex}`)
})

test('redirect on sign-in', async ({ page, pg }) => {
  const phone = `${Math.floor(Math.random() * 1e9)}`
  // naive but go to home page to see if user is logged in
  await page.goto('/auth/sign-up')
  await expect(page).toHaveURL('/auth/sign-up')

  try {
    await signUp(page, phone, expect)

    // ensure use can log in with passkey
    await page.context().clearCookies()
    await page.goto('/send')
    // redirect to send after user is logged in
    await expect(page).toHaveURL('/auth/sign-in?redirectUri=/send')
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    const sendSearchInput = page.getByPlaceholder('Sendtag, Phone, Send ID, Address')
    await expect(sendSearchInput).toBeVisible()
  } finally {
    await pg.query('DELETE FROM auth.users WHERE phone = $1', [phone]).catch((e) => {
      log('delete failed', e)
    })
  }
})
