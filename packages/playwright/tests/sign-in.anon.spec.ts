import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { test as webauthnTest } from '@my/playwright/fixtures/webauthn'
import { userOnboarded } from '@my/snaplet'
import { expect, mergeTests } from '@playwright/test'
import { sendCoin } from 'app/data/coins'
import { assert } from 'app/utils/assert'
import debug from 'debug'
import { signUp } from './fixtures/send-accounts'
import { generatePhone } from './utils/generators'

let log: debug.Debugger

const test = mergeTests(snapletTest, webauthnTest)

test.beforeEach(async ({ page }) => {
  log = debug(`test:sign-in:${test.info().parallelIndex}`)
})

test('redirect on sign-in', async ({ page, pg }) => {
  const phone = generatePhone()
  // naive but go to home page to see if user is logged in
  await page.goto('/auth/sign-up')
  await expect(page).toHaveURL('/auth/sign-up')

  try {
    await signUp(page, phone, expect)

    // ensure use can log in with passkey
    await page.context().clearCookies()
    await page.goto('/send')
    await page.waitForURL(/\//)
    // redirect to send after user is logged in
    await expect(page).toHaveURL(`/?redirectUri=${encodeURIComponent('/send')}`)
    const signInButton = page.getByRole('button', { name: 'SIGN-IN' })
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    const sendSearchInput = page.getByPlaceholder('Search')
    await expect(sendSearchInput).toBeVisible()
  } finally {
    await pg.query('DELETE FROM auth.users WHERE phone = $1', [phone]).catch((e) => {
      log('delete failed', e)
    })
  }
})

test('redirect to send confirm page on sign-in', async ({ page, seed, pg }) => {
  const phone = generatePhone()
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  assert(!!tag?.name, 'tag not found')

  // naive but go to home page to see if user is logged in
  await page.goto('/auth/sign-up')
  await page.waitForURL(/auth\/sign-up/)
  await expect(page).toHaveURL('/auth/sign-up')

  try {
    await signUp(page, phone, expect)

    // ensure use can log in with passkey
    await page.context().clearCookies()
    await page.goto(
      `/send/confirm?idType=tag&recipient=${tag?.name}&amount=1&sendToken=${sendCoin.token}`
    )
    await page.waitForURL(/\//)
    const beforeRedirectUrl = new URL(page.url())
    expect(Object.fromEntries(beforeRedirectUrl.searchParams.entries())).toMatchObject({
      redirectUri: `/send/confirm?idType=tag&recipient=${tag?.name}&amount=1&sendToken=${sendCoin.token}`,
    })
    // redirect to send after user is logged in
    const signInButton = page.getByRole('button', { name: 'SIGN-IN' })
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    await page.waitForURL(/send\/confirm/)
    //@todo: find a way to wait for the new url and check query params like above
    //       Checking the url strimg is not sturdy because it cares about the query params order
    await expect(page).toHaveURL(
      `/send/confirm?idType=tag&recipient=${tag?.name}&amount=1&sendToken=${sendCoin.token}`
    )
  } finally {
    await pg.query('DELETE FROM auth.users WHERE phone = $1', [phone]).catch((e) => {
      log('delete failed', e)
    })
  }
})
