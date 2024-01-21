import { expect, test as baseTest, mergeTests } from '@playwright/test'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { countries } from 'app/utils/country'
import { SUPABASE_URL } from 'app/utils/supabase/admin'
import debug from 'debug'

let log: debug.Debugger

const test = mergeTests(snapletTest, baseTest)

test.beforeEach(async ({ page }) => {
  log = debug(`test:sign-in:${test.info().parallelIndex}`)
})

const randomCountry = () =>
  countries[Math.floor(Math.random() * countries.length)] as (typeof countries)[number]

test('can login', async ({ page, pg }) => {
  const phone = `${Math.floor(Math.random() * 1e9)}`
  // naive but go to home page to see if user is logged in
  await page.goto('/')
  await expect(page).toHaveURL('/sign-in')
<<<<<<< HEAD
  await page.getByLabel('Phone number').fill(phone)
  try {
    await page.getByRole('button', { name: 'SEND IT!' }).click()
    await page.getByLabel('One-time Password').fill('123456')
    await page.getByRole('button', { name: 'Verify' }).click()
    await page.waitForLoadState()
    await expect(page).toHaveURL('/onboarding')
  } finally {
    await pg.query('DELETE FROM auth.users WHERE phone = $1', [phone])
  }
=======
  await page.getByLabel('Phone number').fill(`${Math.floor(Math.random() * 1e9)}`)
  await page.getByRole('button', { name: '/SEND IT!' }).click()
  await page.getByLabel('One-time Password').fill('123456')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForLoadState()
  await expect(page).toHaveURL('/onboarding')
>>>>>>> 69d18cb (New Sign In Screen with Sidebar)
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
  await page.goto('/')
  await expect(page).toHaveURL('/sign-in')
  await ipPromise

  await expect(page.getByText(`${country.flag} +${country.dialCode}`)).toBeVisible()
  await page.getByLabel('Phone number').fill(phone)

  // ensure that auth api receives the correct country code
  await context.route(`${SUPABASE_URL}/auth/v1/verify*`, async (route) => {
    log('route', route.request().url())
    log('route', route.request().postDataJSON())
    expect(route.request().postDataJSON().phone).toBe(`${country.dialCode}${phone}`)
    await route.fulfill({
      json: await route.fetch().then((res) => res.json()),
    })
  })
<<<<<<< HEAD
  try {
    await page.getByRole('button', { name: 'SEND IT!' }).click()
    await page.getByLabel('One-time Password').fill('123456')
    await page.getByRole('button', { name: 'Verify' }).click()
    await page.waitForLoadState()
    await expect(page).toHaveURL('/onboarding')
  } finally {
    await pg.query('DELETE FROM auth.users WHERE phone = $1', [phone])
  }
=======

  await page.getByRole('button', { name: '/SEND IT!' }).click()
  await page.getByLabel('One-time Password').fill('123456')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForLoadState()
  await expect(page).toHaveURL('/onboarding')
>>>>>>> 69d18cb (New Sign In Screen with Sidebar)
})
