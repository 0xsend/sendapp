import { expect, mergeTests } from '@playwright/test'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { test as webauthnTest } from '@my/playwright/fixtures/webauthn'
import { countries } from 'app/utils/country'
import { SUPABASE_URL } from 'app/utils/supabase/admin'
import debug from 'debug'
import { signUp } from './fixtures/send-accounts'

let log: debug.Debugger

const test = mergeTests(snapletTest, webauthnTest)

test.beforeEach(async ({ page }) => {
  log = debug(`test:sign-in:${test.info().parallelIndex}`)
})

const randomCountry = () =>
  countries[Math.floor(Math.random() * countries.length)] as (typeof countries)[number]

test('can sign up', async ({ page, pg }) => {
  const phone = `${Math.floor(Math.random() * 1e9)}`
  // naive but go to home page to see if user is logged in
  await page.goto('/')
  const signInLink = page.getByRole('link', { name: 'Sign In' })
  await expect(signInLink).toBeVisible()
  await signInLink.click()
  await expect(page).toHaveURL('/auth/sign-in')
  const signUpLink = page.getByRole('link', { name: 'Sign Up' })
  await expect(signUpLink).toBeVisible()
  await signUpLink.click()
  await expect(page).toHaveURL('/auth/sign-up')

  try {
    await signUp(page, phone, expect)

    // ensure use can log in with passkey
    await page.context().clearCookies()
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(signInLink).toBeVisible()
    await signInLink.click()
    await expect(page).toHaveURL('/auth/sign-in')
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    const homeHeader = page
      .getByRole('heading', { name: 'Home', exact: true })
      .and(page.getByText('Home'))
    await expect(homeHeader).toBeVisible()
  } finally {
    await pg.query('DELETE FROM auth.users WHERE phone = $1', [phone]).catch((e) => {
      log('delete failed', e)
    })
  }
})

test('country code is selected based on geoip', async ({ page, context, pg }) => {
  const country = randomCountry()
  const phone = `${Math.floor(Math.random() * 1e9)}`

  await page.route('https://ipapi.co/json/', async (route) => {
    await route.fulfill({
      json: { country_code: country.code },
    })
  })

  const ipPromise = page.waitForRequest('https://ipapi.co/json/')
  await page.goto('/auth/sign-up')
  await expect(page).toHaveURL('/auth/sign-up')
  await ipPromise

  await expect(page.getByText(`${country.flag} +${country.dialCode}`)).toBeVisible()

  // ensure that auth api receives the correct country code
  await context.route(`${SUPABASE_URL}/auth/v1/verify*`, async (route) => {
    log('route', route.request().url())
    log('route', route.request().postDataJSON())
    expect(route.request().postDataJSON().phone).toBe(`${country.dialCode}${phone}`)
    await route.fulfill({
      json: await route.fetch().then((res) => res.json()),
    })
  })

  try {
    await signUp(page, phone, expect)
  } finally {
    await pg.query('DELETE FROM auth.users WHERE phone = $1', [phone])
  }
})
