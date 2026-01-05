import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import debug from 'debug'

const test = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

test.beforeAll(async () => {
  log = debug(`test:profile:external:onboarded:${test.info().workerIndex}`)
})

/**
 * Generates a random valid Ethereum address that is guaranteed not to have a Send account
 */
function generateExternalAddress(): `0x${string}` {
  return privateKeyToAddress(generatePrivateKey())
}

test.describe('External Address Profile - Logged In User', () => {
  test('can view external address profile and see activity section', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    log('Testing external address:', externalAddress)

    await page.goto(`/profile/${externalAddress}`)

    // Should show external address view
    await expect(page.getByTestId('externalAddress')).toBeVisible()
    await expect(page.getByTestId('externalAddress')).toHaveText('External Address')

    // Should show truncated address with copy button
    await expect(page.getByTestId('copyAddressButton')).toBeVisible()

    // Should show Activity section
    await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeVisible()

    // Should show send button
    await expect(page.getByTestId('externalAddressSendButton')).toBeVisible()

    // Should show add contact button (not yet a contact)
    await expect(page.getByTestId('externalAddressAddContactButton')).toBeVisible()

    // Should show "No transaction history" for new address
    await expect(page.getByText('No transaction history')).toBeVisible()
  })

  test('can open SendChat by clicking send button', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    log('Testing SendChat open:', externalAddress)

    await page.goto(`/profile/${externalAddress}`)

    // Wait for page to load
    await expect(page.getByTestId('externalAddressSendButton')).toBeVisible()

    // Click send button
    await page.getByTestId('externalAddressSendButton').click()

    // SendChat should open - verify the send form appears
    await expect(page.getByPlaceholder('Type amount, add a note...')).toBeVisible({
      timeout: 10000,
    })

    // Verify URL params are set correctly for the recipient
    const url = new URL(page.url())
    expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({
      recipient: externalAddress,
      idType: 'address',
    })
  })

  test('can add external address as contact', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    log('Testing add contact:', externalAddress)

    await page.goto(`/profile/${externalAddress}`)

    // Should show add contact button
    await expect(page.getByTestId('externalAddressAddContactButton')).toBeVisible()

    // Click add contact button
    await page.getByTestId('externalAddressAddContactButton').click()

    // Wait for the contact to be added - button should change to favorite/edit buttons
    await expect(page.getByTestId('externalAddressToggleFavoriteButton')).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByTestId('externalAddressEditContactButton')).toBeVisible()

    // Add contact button should no longer be visible
    await expect(page.getByTestId('externalAddressAddContactButton')).not.toBeVisible()
  })

  test('can toggle favorite on contact', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    log('Testing toggle favorite:', externalAddress)

    await page.goto(`/profile/${externalAddress}`)

    // First add as contact
    await expect(page.getByTestId('externalAddressAddContactButton')).toBeVisible()
    await page.getByTestId('externalAddressAddContactButton').click()

    // Wait for favorite button to appear
    await expect(page.getByTestId('externalAddressToggleFavoriteButton')).toBeVisible({
      timeout: 10000,
    })

    // Click favorite button
    await page.getByTestId('externalAddressToggleFavoriteButton').click()

    // Wait for toast or UI update indicating favorite was added
    // The button should still be visible but the icon changes (filled heart)
    await expect(page.getByTestId('externalAddressToggleFavoriteButton')).toBeVisible()
  })

  test('can open edit contact sheet and edit name', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    log('Testing edit contact sheet:', externalAddress)

    await page.goto(`/profile/${externalAddress}`)

    // First add as contact
    await expect(page.getByTestId('externalAddressAddContactButton')).toBeVisible()
    await page.getByTestId('externalAddressAddContactButton').click()

    // Wait for edit button to appear
    await expect(page.getByTestId('externalAddressEditContactButton')).toBeVisible({
      timeout: 10000,
    })

    // Click edit button to open sheet
    await page.getByTestId('externalAddressEditContactButton').click()

    // Contact detail sheet should open - look for "Edit Contact" button
    await expect(page.getByRole('button', { name: 'Edit Contact' })).toBeVisible({ timeout: 5000 })

    // Click "Edit Contact" button to enter edit mode
    await page.getByRole('button', { name: 'Edit Contact' }).click()

    // The name input should now be visible with placeholder "Display name"
    await expect(page.getByPlaceholder('Display name')).toBeVisible({ timeout: 5000 })
  })

  test('contact name is displayed after adding custom name', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    const customName = 'Test Contact Name'
    log('Testing custom name display:', externalAddress)

    await page.goto(`/profile/${externalAddress}`)

    // First add as contact
    await expect(page.getByTestId('externalAddressAddContactButton')).toBeVisible()
    await page.getByTestId('externalAddressAddContactButton').click()

    // Wait for edit button to appear
    await expect(page.getByTestId('externalAddressEditContactButton')).toBeVisible({
      timeout: 10000,
    })

    // Open edit sheet
    await page.getByTestId('externalAddressEditContactButton').click()

    // Wait for sheet to open - look for "Edit Contact" button
    await expect(page.getByRole('button', { name: 'Edit Contact' })).toBeVisible({ timeout: 5000 })

    // Click "Edit Contact" button to enter edit mode
    await page.getByRole('button', { name: 'Edit Contact' }).click()

    // Wait for name input to appear
    await expect(page.getByPlaceholder('Display name')).toBeVisible({ timeout: 5000 })

    // Enter custom name
    await page.getByPlaceholder('Display name').fill(customName)

    // Save the contact
    await page.getByRole('button', { name: 'Save' }).click()

    // Wait for sheet to close (Save button should disappear)
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible({ timeout: 5000 })

    // Close the sheet by pressing escape or clicking outside
    await page.keyboard.press('Escape')

    // Wait for name to update on the profile page
    await expect(page.getByTestId('externalAddress')).toHaveText(customName, { timeout: 10000 })
  })
})

test.describe('External Address History - Logged In User', () => {
  test('can view external address history page', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    log('Testing external address history:', externalAddress)

    await page.goto(`/profile/${externalAddress}/history`)

    // Should show history page
    await expect(page.getByTestId('externalAddressHistory')).toBeVisible()
    await expect(page.getByTestId('externalAddressHistory')).toHaveText('Address History')

    // Should show truncated address
    const truncatedAddress = `${externalAddress.slice(0, 6)}...${externalAddress.slice(-4)}`
    await expect(page.getByText(truncatedAddress)).toBeVisible()

    // Should show send button
    await expect(page.getByTestId('externalAddressSendButton')).toBeVisible()

    // Should show back to profile link
    await expect(page.getByText('Back to Profile')).toBeVisible()

    // Should show Basescan link
    await expect(page.getByText('View on Basescan')).toBeVisible()

    // Should show "No Send activity" message for new address
    await expect(page.getByText('No Send activity with this address')).toBeVisible()
  })
})
