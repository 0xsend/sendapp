import { test } from '@playwright/test'

test('can login', async ({ page }) => {
  // naive but go to home page to see if user is logged in
  await page.goto('/')
  await expect(page).toHaveURL('/sign-in')
  await page.getByLabel('Phone number').fill(`${Math.floor(Math.random() * 1e9)}`)
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await page.getByLabel('Enter the code we sent you').fill('123456')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForLoadState()
  // TODO: will need to be updated once we have new layout
  expect(page.getByRole('heading', { name: 'Send Tags' })).toBeVisible()
})
