/**
 * E2E tests for the Contacts feature.
 *
 * Tests the contact book functionality including:
 * - Page navigation and loading
 * - Contact search and filtering
 * - Adding contacts (Send users and external addresses)
 * - Contact management (favorites, details, archiving)
 */

import { expect, test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { createUserWithTagsAndAccounts } from '@my/snaplet'
import type { Database } from '@my/supabase/database.types'
import { mergeTests } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assert } from 'app/utils/assert'
import debug from 'debug'

const test = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

test.beforeEach(async ({ user }) => {
  log = debug(`test:contacts:${user.profile.id}:${test.info().parallelIndex}`)
})

test.describe('Contacts Page', () => {
  test('can visit contacts page', async ({ page }) => {
    log('navigating to contacts page')
    await page.goto('/contacts')

    // Verify the page loads
    await expect(page).toHaveURL('/contacts')

    // Verify the search input is visible (confirms page loaded)
    const searchInput = page.getByTestId('contactSearchInput')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    log('contacts page loaded successfully')
  })

  test('shows filter chips', async ({ page }) => {
    await page.goto('/contacts')

    // Verify All filter chip is visible
    const allChip = page.getByTestId('filterChip-all')
    await expect(allChip).toBeVisible({ timeout: 10_000 })

    // Verify Favorites filter chip is visible
    const favoritesChip = page.getByTestId('filterChip-favorites')
    await expect(favoritesChip).toBeVisible()

    log('filter chips are visible')
  })

  test('shows add contact button', async ({ page }) => {
    await page.goto('/contacts')

    // Verify Add button is visible
    const addButton = page.getByTestId('addContactButton')
    await expect(addButton).toBeVisible({ timeout: 10_000 })

    log('add contact button is visible')
  })
})

test.describe('Contact Search', () => {
  test('can search contacts by name', async ({ page, seed, supabase, pg }) => {
    // Create a contact user to search for
    const contactPlan = await createUserWithTagsAndAccounts(seed)
    const contactProfile = contactPlan.profile
    assert(!!contactProfile?.name, 'contact profile name not found')

    // Add the user as a contact via database
    const ownerId = await getCurrentUserId(supabase)
    await addContactViaDatabase(pg, ownerId, contactPlan.user.id, {
      custom_name: `SearchTest_${contactProfile.name}`,
    })

    log(`created contact with custom name: SearchTest_${contactProfile.name}`)

    await page.goto('/contacts')

    // Find and fill search input
    const searchInput = page.getByTestId('contactSearchInput')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill('SearchTest')

    // Wait for debounced search to complete and verify results
    await expect(async () => {
      const contactItem = page.getByText(`SearchTest_${contactProfile.name}`)
      await expect(contactItem).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 5_000 })

    log('search returned expected contact')
  })

  test('can clear search query', async ({ page }) => {
    await page.goto('/contacts')

    const searchInput = page.getByTestId('contactSearchInput')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    // Enter a search query
    await searchInput.fill('test')
    await expect(searchInput).toHaveValue('test')

    // Find and click clear button
    const clearButton = page.getByTestId('contactSearchClear')
    await expect(clearButton).toBeVisible()
    await clearButton.click()

    // Verify search is cleared
    await expect(searchInput).toHaveValue('')
    log('search cleared successfully')
  })
})

test.describe('Add Contact', () => {
  test('can add contact by sendtag', async ({ page, seed }) => {
    // Create a user to add as contact
    const targetPlan = await createUserWithTagsAndAccounts(seed)
    const targetTag = targetPlan.tags[0]
    const targetProfile = targetPlan.profile
    assert(!!targetTag?.name, 'target tag not found')
    assert(!!targetProfile?.name, 'target profile name not found')

    log(`target user created: ${targetProfile.name}, tag: ${targetTag.name}`)

    await page.goto('/contacts')

    // Click Add button
    const addButton = page.getByTestId('addContactButton')
    await expect(addButton).toBeVisible({ timeout: 10_000 })
    await addButton.click()

    // Verify Add Contact form opens
    const formTitle = page.getByText('Add Contact').first()
    await expect(formTitle).toBeVisible({ timeout: 5_000 })

    // Click Sendtag lookup type button
    const sendtagButton = page.getByRole('button', { name: 'Sendtag' })
    await expect(sendtagButton).toBeVisible()
    await sendtagButton.click()

    // Enter the sendtag
    const identifierInput = page.getByPlaceholder(/enter sendtag/i)
    await expect(identifierInput).toBeVisible()
    await identifierInput.fill(targetTag.name)

    // Wait for profile preview to load
    await expect(async () => {
      const previewName = page.getByText(targetProfile.name)
      await expect(previewName).toBeVisible({ timeout: 3_000 })
    }).toPass({ timeout: 10_000 })

    // Click Add Contact submit button
    const submitButton = page.getByRole('button', { name: 'Add Contact' }).last()
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // Verify success toast
    await expect(page.getByText(/contact added|added to contacts/i)).toBeVisible({ timeout: 5_000 })

    log('contact added via sendtag')
  })

  test('can add external contact', async ({ page }) => {
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f4975d'
    const testName = 'Test External Wallet'

    await page.goto('/contacts')

    // Click Add button
    const addButton = page.getByTestId('addContactButton')
    await expect(addButton).toBeVisible({ timeout: 10_000 })
    await addButton.click()

    // Switch to External Address tab
    const externalTab = page.getByRole('button', { name: 'External Address' })
    await expect(externalTab).toBeVisible({ timeout: 5_000 })
    await externalTab.click()

    // Fill in external address
    const addressInput = page.getByPlaceholder(/0x/i)
    await expect(addressInput).toBeVisible()
    await addressInput.fill(testAddress)

    // Fill in display name
    const nameInput = page.getByPlaceholder(/enter a name/i)
    await expect(nameInput).toBeVisible()
    await nameInput.fill(testName)

    // Submit
    const submitButton = page.getByRole('button', { name: 'Add Contact' }).last()
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // Verify success toast
    await expect(page.getByText(/contact added|added to contacts/i)).toBeVisible({ timeout: 5_000 })

    log('external contact added')
  })
})

test.describe('Contact Favorites', () => {
  test('can toggle favorite on contact', async ({ page, seed, supabase, pg }) => {
    // Create and add a contact
    const contactPlan = await createUserWithTagsAndAccounts(seed)
    const contactProfile = contactPlan.profile
    assert(!!contactProfile?.name, 'contact profile not found')

    const ownerId = await getCurrentUserId(supabase)
    await addContactViaDatabase(pg, ownerId, contactPlan.user.id, {
      custom_name: `FavTest_${contactProfile.name}`,
    })

    log(`contact added: FavTest_${contactProfile.name}`)

    await page.goto('/contacts')

    // Find the contact in the list and click it
    const contactItem = page.getByText(`FavTest_${contactProfile.name}`)
    await expect(contactItem).toBeVisible({ timeout: 10_000 })
    await contactItem.click()

    // Wait for detail sheet to open
    const detailTitle = page.getByText('Contact Details')
    await expect(detailTitle).toBeVisible({ timeout: 5_000 })

    // Find and click favorite button (the circular button with star icon)
    const favoriteButton = page.locator('button[aria-label*="favorite" i], button:has(svg)')
    const starButton = favoriteButton.filter({ hasNot: page.getByText('Edit') }).first()
    await starButton.click()

    // Verify the toggle worked (toast message)
    await expect(page.getByText(/added to favorites|removed from favorites/i)).toBeVisible({
      timeout: 5_000,
    })

    log('favorite toggled')
  })

  test('can filter by favorites', async ({ page, seed, supabase, pg }) => {
    // Create two contacts, one favorite
    const contact1 = await createUserWithTagsAndAccounts(seed)
    const contact2 = await createUserWithTagsAndAccounts(seed)
    const contact1Name = `FavYes_${contact1.profile.name}`
    const contact2Name = `FavNo_${contact2.profile.name}`

    const ownerId = await getCurrentUserId(supabase)
    await addContactViaDatabase(pg, ownerId, contact1.user.id, {
      is_favorite: true,
      custom_name: contact1Name,
    })
    await addContactViaDatabase(pg, ownerId, contact2.user.id, {
      is_favorite: false,
      custom_name: contact2Name,
    })

    log(`created contacts: ${contact1Name} (favorite), ${contact2Name} (not favorite)`)

    await page.goto('/contacts')

    // Verify both contacts are initially visible
    await expect(page.getByText(contact1Name)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(contact2Name)).toBeVisible()

    // Click Favorites filter chip
    const favoritesChip = page.getByTestId('filterChip-favorites')
    await expect(favoritesChip).toBeVisible()
    await favoritesChip.click()

    // Verify only favorited contact is shown
    await expect(async () => {
      await expect(page.getByText(contact1Name)).toBeVisible({ timeout: 2_000 })
      await expect(page.getByText(contact2Name)).not.toBeVisible()
    }).toPass({ timeout: 5_000 })

    log('favorites filter working correctly')
  })
})

test.describe('Contact Details', () => {
  test('can view contact details', async ({ page, seed, supabase, pg }) => {
    const contactPlan = await createUserWithTagsAndAccounts(seed)
    const contactProfile = contactPlan.profile
    const contactTag = contactPlan.tags[0]
    assert(!!contactProfile?.name, 'contact profile not found')
    assert(!!contactTag?.name, 'contact tag not found')

    const ownerId = await getCurrentUserId(supabase)
    await addContactViaDatabase(pg, ownerId, contactPlan.user.id)

    await page.goto('/contacts')

    // Click on contact to open detail sheet
    const contactItem = page.getByText(contactProfile.name)
    await expect(contactItem).toBeVisible({ timeout: 10_000 })
    await contactItem.click()

    // Verify detail sheet opens with correct info
    const detailTitle = page.getByText('Contact Details')
    await expect(detailTitle).toBeVisible({ timeout: 5_000 })

    // Verify name is displayed
    await expect(page.getByText(contactProfile.name)).toBeVisible()

    // Verify sendtag is displayed
    await expect(page.getByText(`/${contactTag.name}`)).toBeVisible()

    log('contact details displayed correctly')
  })

  test('can edit contact notes', async ({ page, seed, supabase, pg }) => {
    const contactPlan = await createUserWithTagsAndAccounts(seed)
    const contactProfile = contactPlan.profile
    assert(!!contactProfile?.name, 'contact profile not found')

    const ownerId = await getCurrentUserId(supabase)
    await addContactViaDatabase(pg, ownerId, contactPlan.user.id, {
      custom_name: `EditTest_${contactProfile.name}`,
    })

    await page.goto('/contacts')

    // Click on contact
    const contactItem = page.getByText(`EditTest_${contactProfile.name}`)
    await expect(contactItem).toBeVisible({ timeout: 10_000 })
    await contactItem.click()

    // Wait for detail sheet
    await expect(page.getByText('Contact Details')).toBeVisible({ timeout: 5_000 })

    // Click Edit Contact button
    const editButton = page.getByRole('button', { name: 'Edit Contact' })
    await expect(editButton).toBeVisible()
    await editButton.click()

    // Fill in notes
    const notesInput = page.getByPlaceholder(/add notes/i)
    await expect(notesInput).toBeVisible()
    await notesInput.fill('Updated notes from E2E test')

    // Save
    const saveButton = page.getByRole('button', { name: 'Save' })
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // Verify success
    await expect(page.getByText(/contact updated/i)).toBeVisible({ timeout: 5_000 })

    log('contact notes updated')
  })
})

test.describe('Contact Archive', () => {
  test('can archive contact', async ({ page, seed, supabase, pg }) => {
    const contactPlan = await createUserWithTagsAndAccounts(seed)
    const contactProfile = contactPlan.profile
    assert(!!contactProfile?.name, 'contact profile not found')

    const archiveName = `ArchiveTest_${contactProfile.name}`
    const ownerId = await getCurrentUserId(supabase)
    await addContactViaDatabase(pg, ownerId, contactPlan.user.id, {
      custom_name: archiveName,
    })

    await page.goto('/contacts')

    // Click on contact
    const contactItem = page.getByText(archiveName)
    await expect(contactItem).toBeVisible({ timeout: 10_000 })
    await contactItem.click()

    // Wait for detail sheet
    await expect(page.getByText('Contact Details')).toBeVisible({ timeout: 5_000 })

    // Find and click Archive Contact button
    const archiveButton = page.getByRole('button', { name: /archive contact/i })
    await expect(archiveButton).toBeVisible()
    await archiveButton.click()

    // Confirm archive
    const confirmButton = page.getByRole('button', { name: 'Archive' })
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()

    // Verify success toast
    await expect(page.getByText(/contact archived/i)).toBeVisible({ timeout: 5_000 })

    // Verify contact is no longer visible in list
    await expect(page.getByText(archiveName)).not.toBeVisible({ timeout: 3_000 })

    log('contact archived and removed from list')
  })
})

// Helper functions

/**
 * Gets the current authenticated user's ID from Supabase.
 */
async function getCurrentUserId(supabase: SupabaseClient<Database>): Promise<string> {
  const { data: sendAccount, error } = await supabase
    .from('send_accounts')
    .select('user_id')
    .single()
  if (error) throw new Error(`Failed to get current user: ${error.message}`)
  if (!sendAccount?.user_id) throw new Error('user_id not found')
  return sendAccount.user_id
}

/**
 * Adds a contact directly via the database for test setup.
 * Uses direct SQL insert since add_contact is service_role only.
 */
async function addContactViaDatabase(
  pg: import('pg').Client,
  ownerId: string,
  contactUserId: string,
  options: { is_favorite?: boolean; custom_name?: string; notes?: string; source?: string } = {}
): Promise<number> {
  const result = await pg.query(
    `INSERT INTO contacts (owner_id, contact_user_id, is_favorite, custom_name, notes, source)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      ownerId,
      contactUserId,
      options.is_favorite ?? false,
      options.custom_name ?? null,
      options.notes ?? null,
      options.source ?? 'manual',
    ]
  )

  const contactId = result.rows[0]?.id
  assert(typeof contactId === 'number' || typeof contactId === 'bigint', 'contact id not returned')
  return Number(contactId)
}
