import { expect, test as baseTest, mergeTests, type Expect, type Page } from '@playwright/test'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { test as webauthnTest } from '@my/playwright/fixtures/webauthn'
import { countries } from 'app/utils/country'
import { SUPABASE_URL } from 'app/utils/supabase/admin'
import debug from 'debug'
import { OnboardingPage } from './fixtures/send-accounts'

let log: debug.Debugger

const test = mergeTests(snapletTest, webauthnTest)

test.beforeEach(async ({ page }) => {
  log = debug(`test:sign-in:${test.info().parallelIndex}`)
})

const randomCountry = () =>
  countries[Math.floor(Math.random() * countries.length)] as (typeof countries)[number]

const signUp = async (page: Page, phone: string, expect: Expect) => {
  await page.getByLabel('Phone number').fill(phone)
  const signUpButton = page.getByRole('button', { name: 'Sign Up' })
  await expect(signUpButton).toBeVisible()
  await expect(signUpButton).toBeEnabled()
  await signUpButton.click()
  const otpInput = page.getByLabel('One-time Password')
  await expect(otpInput).toBeVisible()
  await otpInput.fill('123456')
  const verifyAccountButton = page.getByRole('button', { name: 'VERIFY ACCOUNT' })
  await expect(verifyAccountButton).toBeVisible()
  await verifyAccountButton.click()
  await page.waitForLoadState()
  await expect(page).toHaveURL('/auth/onboarding')
  const onboardinPage = new OnboardingPage(page)
  await onboardinPage.completeOnboarding(expect)
}

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
