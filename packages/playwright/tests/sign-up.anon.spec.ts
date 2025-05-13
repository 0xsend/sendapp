import { expect, mergeTests } from '@playwright/test'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { test as webauthnTest } from '@my/playwright/fixtures/webauthn'
import debug from 'debug'
import { signUp } from './fixtures/send-accounts'
import { generateCountry, generateSendtag } from './utils/generators'

let log: debug.Debugger

const test = mergeTests(snapletTest, webauthnTest)

test.beforeEach(async ({ page }) => {
  log = debug(`test:sign-in:${test.info().parallelIndex}`)
})

test('can sign up', async ({ page, pg }) => {
  const sendtag = generateSendtag()
  // naive but go to home page to see if user is logged in
  await page.goto('/')
  const signUpLink = page.getByRole('link', { name: 'SIGN-UP' })
  await expect(signUpLink).toBeVisible()
  await signUpLink.click()
  await expect(page).toHaveURL('/auth/sign-up')

  try {
    await signUp(page, sendtag, expect)

    // ensure use can log in with passkey
    await page.context().clearCookies()
    await page.goto('/')
    await expect(page).toHaveURL('/')
    const signInButton = page.getByRole('button', { name: 'SIGN-IN' })
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    // @todo: Heading checks need to be refactored to mobile only
    // const homeHeader = page
    //   .getByRole('heading', { name: 'Home', exact: true })
    //   .and(page.getByText('Home'))
    // await expect(homeHeader).toBeVisible()

    // checking if anything from home page is visible
    await expect(page.getByRole('link', { name: 'Account' })).toBeVisible()
  } finally {
    await pg.query('DELETE FROM auth.users WHERE email like $1', [`${sendtag}_%`]).catch((e) => {
      log('delete failed', e)
    })
  }
})

test('country code is selected based on geoip', async ({ page, context, pg }) => {
  const country = generateCountry()

  await page.route('https://ipapi.co/json/', async (route) => {
    await route.fulfill({
      json: { country_code: country.code },
    })
  })

  const ipPromise = page.waitForRequest('https://ipapi.co/json/')
  await page.goto('/auth/sign-up')
  await page.getByText('login with phone', { exact: false }).click()
  await page.waitForURL('/auth/login-with-phone')
  await ipPromise

  await expect(page.getByText(`${country.flag} +${country.dialCode}`)).toBeVisible()
})
