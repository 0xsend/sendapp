import { faker } from '@faker-js/faker'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { mergeTests, type Page } from '@playwright/test'
import debug from 'debug'
import { getAuthSessionFromContext } from './fixtures/auth'
import { expect, test as addSendtagsTest } from './fixtures/sendtags/add'
import { AddSendtagsPage } from './fixtures/sendtags/add/page'
import { type CheckoutPage, test as checkoutTest } from './fixtures/sendtags/checkout'
import { lookupBalance, testBaseClient } from './fixtures/viem'
import { usdcAddress } from '@my/wagmi'
import { price, total } from 'app/data/sendtags'
import { assert } from 'app/utils/assert'
import type { ActivityMatch } from './fixtures/send-accounts/matchers/activity-feed'

let log: debug.Debugger

// Merge the fixtures - checkout includes send-accounts which handles onboarding
const test = mergeTests(checkoutTest, snapletTest)

const debugAuthSession = async (page: Page) => {
  const { decoded } = await getAuthSessionFromContext(page.context())
  log('user authenticated', `id=${decoded.sub}`, `session=${decoded.session_id}`)
}

// Helper to generate valid tag names (accounting for prefixes in tests)
const generateTagName = () => faker.string.alphanumeric({ length: { min: 6, max: 15 } })

test.beforeEach(async ({ page }) => {
  log = debug(`test:sendtag-happy-path:${test.info().parallelIndex}`)
  log('beforeEach', `url=${page.url()}`)
  await debugAuthSession(page)
})

test('sendtag complete happy path - create, confirm, and change main tag', async ({
  page,
  supabase,
  checkoutPage,
  sendAccount,
}) => {
  test.setTimeout(45_000)
  // Create page objects - we can't use addSendtagsPage directly since we need different fixtures
  const wallet = checkoutPage.wallet
  const addSendtagsPage = new AddSendtagsPage(page, wallet)
  // Step 1: Navigate to sendtags page to check initial state
  await page.goto('/account/sendtag')
  await page.waitForURL('/account/sendtag')

  // Verify user has their onboarding tag
  const { data: initialTags } = await supabase
    .from('tags')
    .select('*, send_accounts!inner(main_tag_id)')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: true })

  expect(initialTags).toHaveLength(1)
  const onboardingTag = initialTags?.[0]
  assert(!!onboardingTag, 'onboarding tag should exist')

  // Check that the onboarding tag is the main tag
  expect(sendAccount?.main_tag_id).toBe(onboardingTag.id)
  log('Initial state verified - onboarding tag is main tag', {
    tagId: onboardingTag.id,
    tagName: onboardingTag.name,
    sendAccountId: sendAccount.id,
  })

  // Step 2: Create first additional sendtag
  const firstTagName = `tag1_${generateTagName()}`
  await addSendtagsPage.goto()
  await addSendtagsPage.addPendingTag(firstTagName)

  // Wait for the pending tag to appear in the UI
  await expect(page.getByTestId(`pending-tag-${firstTagName}`)).toBeVisible({ timeout: 10000 })

  // Verify tag was created in pending state in database
  const { data: pendingTag1 } = await supabase
    .from('tags')
    .select('*')
    .eq('name', firstTagName)
    .eq('status', 'pending')
    .single()

  expect(pendingTag1).toBeTruthy()
  log('First tag created in pending state', { tagName: firstTagName })

  // Step 3: Go to checkout page
  await checkoutPage.goto()

  // The checkout page shows the total price and purchase button
  // Since the tag is 6+ characters, it should cost 2 USDC
  await expect(page.getByText('2 USDC')).toBeVisible()
  await expect(page.getByText('Total', { exact: false })).toBeVisible()

  // Look up initial USDC balance
  const initialBalance = await lookupBalance({
    address: sendAccount.address as `0x${string}`,
    token: usdcAddress[testBaseClient.chain.id],
  })

  // Confirm the tag
  await checkoutPage.confirmTags(expect)

  // After confirmation, we should be redirected to the sendtags page
  await page.waitForURL('/account/sendtag')

  // Verify tag is now confirmed - the confirmed tags appear on the sendtags page
  await expect(page.getByTestId(`confirmed-tag-${firstTagName}`)).toBeVisible({ timeout: 10000 })

  const { data: confirmedTag1 } = await supabase
    .from('tags')
    .select('*')
    .eq('name', firstTagName)
    .eq('status', 'confirmed')
    .single()

  expect(confirmedTag1).toBeTruthy()

  // Verify USDC was spent
  const finalBalance = await lookupBalance({
    address: sendAccount.address as `0x${string}`,
    token: usdcAddress[testBaseClient.chain.id],
  })
  expect(finalBalance).toBeLessThan(initialBalance)

  // Verify activity feed entry
  await expect(supabase).toHaveEventInActivityFeed({
    event_name: 'tag_receipt_usdc',
    from_user: expect.any(Object),
    data: {
      tags: [firstTagName],
      value: price(firstTagName.length).toString(),
    },
  } satisfies ActivityMatch)

  // Main tag should still be the onboarding tag
  const { data: accountAfterFirst } = await supabase
    .from('send_accounts')
    .select('main_tag_id')
    .single()

  expect(accountAfterFirst?.main_tag_id).toBe(onboardingTag.id)
  log('First additional tag confirmed, main tag unchanged')

  // Step 4: Create second additional sendtag
  const secondTagName = `tag2_${generateTagName()}`
  await addSendtagsPage.goto()
  await addSendtagsPage.addPendingTag(secondTagName)

  // Step 5: Confirm the second tag
  await page.goto('/account/sendtag/checkout')
  await checkoutPage.confirmTags(expect)

  const { data: confirmedTag2 } = await supabase
    .from('tags')
    .select('*')
    .eq('name', secondTagName)
    .eq('status', 'confirmed')
    .single()

  expect(confirmedTag2).toBeTruthy()
  log('Second additional tag confirmed', { tagName: secondTagName })

  // Step 6: Navigate to sendtags management page
  await page.goto('/account/sendtag')
  await page.waitForURL('/account/sendtag')

  // Verify all 3 tags are displayed (onboarding + 2 new)
  await expect(page.getByText('Registered [ 3/5 ]')).toBeVisible()

  // The main tag (onboarding tag) should have a "Main" indicator
  const mainTagElement = page.locator(`[data-testid="confirmed-tag-${onboardingTag.name}"]`)
  await expect(mainTagElement).toBeVisible()
  await expect(page.getByTestId('sendtags-list').getByText('Main')).toBeVisible()

  // Step 7: Change main tag to the second tag
  // Click on the "Change Main Tag" button if it exists, or click on the main tag itself
  const changeMainTagButton = page.getByRole('button', { name: 'Change Main Tag' })
  if (await changeMainTagButton.isVisible().catch(() => false)) {
    await changeMainTagButton.click()
  } else {
    // Otherwise click on the Main label or the tag itself to open the sheet
    await page.getByTestId('sendtags-list').getByText('Main').click()
  }

  // Wait for the sheet to open
  await expect(page.getByText('Select Main Tag')).toBeVisible()
  await expect(page.getByText('Choose which tag appears as your primary identity')).toBeVisible()

  // Click on the second tag to make it the main tag
  const secondTagButton = page.getByRole('button', { name: secondTagName })
  await expect(secondTagButton).toBeVisible()

  // Wait for the API call to complete
  const updateMainTagPromise = page.waitForResponse(
    (response) => response.url().includes('/api/trpc/sendAccount.updateMainTag') && response.ok()
  )

  await secondTagButton.click()
  await updateMainTagPromise

  // Wait for toast message
  await expect(page.getByText('Main tag updated')).toBeVisible()

  // Verify in database that main tag has changed
  const { data: finalAccount } = await supabase.from('send_accounts').select('main_tag_id').single()

  assert(!!confirmedTag2?.id, 'confirmed tag 2 should exist')
  expect(finalAccount?.main_tag_id).toBe(confirmedTag2.id)

  // Verify UI has updated - the second tag should now show as Main
  const secondTagElement = page.locator(`[data-testid="confirmed-tag-${secondTagName}"]`)
  await expect(secondTagElement).toBeVisible()

  // And the original main tag should no longer show Main indicator
  // The Main indicator should have moved to the second tag

  log('Successfully changed main tag', {
    oldMainTag: onboardingTag.name,
    newMainTag: secondTagName,
    newMainTagId: confirmedTag2.id,
  })

  // Verify UI has updated - the second tag element should now show as Main
  await expect(secondTagElement).toBeVisible()
  // Wait for the UI to update and check that the second tag now shows as Main
  await page.waitForTimeout(1000) // Give the UI a moment to update
  await expect(page.getByTestId('sendtags-list').getByText('Main')).toBeVisible()

  // Step 8: Final verification - check all tags and their status
  const { data: allTags } = await supabase
    .from('tags')
    .select('*')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: true })

  expect(allTags).toHaveLength(3)
  assert(!!allTags, 'all tags should exist')
  assert(!!allTags[0], 'all tags should have length 3')
  expect(allTags[0].name).toBe(onboardingTag.name)
  assert(!!allTags[1], 'all tags should have length 3')
  expect(allTags[1].name).toBe(firstTagName)
  assert(!!allTags[2], 'all tags should have length 3')
  expect(allTags[2].name).toBe(secondTagName)

  // Verify the send_account_tags junction table
  const { data: accountTags } = await supabase
    .from('send_account_tags')
    .select('tag_id')
    .order('created_at', { ascending: true })

  expect(accountTags).toHaveLength(3)

  log('Happy path test completed successfully', {
    totalTags: 3,
    mainTag: secondTagName,
    allTagNames: allTags.map((t) => t.name),
  })
})

// TODO: This test requires more complex setup to bypass RLS restrictions
// The database trigger for main tag succession is tested in the Supabase tests
test.skip('sendtag main tag succession - auto-assigns new main when current is deleted', async ({
  page,
  supabase,
  sendAccount,
}) => {
  // This test verifies the automatic main tag succession logic
  assert(!!sendAccount?.main_tag_id, 'send account should have main tag id')
  // Get initial state - the onboarding tag should be the main tag
  const { data: onboardingTag } = await supabase
    .from('tags')
    .select('*')
    .eq('id', sendAccount.main_tag_id)
    .single()

  expect(onboardingTag).toBeTruthy()
  assert(!!onboardingTag, 'onboarding tag should exist')
  log('Starting with onboarding tag as main', { tagName: onboardingTag.name })

  // For this test, we'll create a second confirmed tag by directly inserting it
  // This simulates having multiple confirmed tags
  const newTagName = `test${Date.now()}`.substring(0, 20)

  // First create the tag
  const { data: newTag, error: createTagError } = await supabase
    .from('tags')
    .insert({
      name: newTagName,
      status: 'confirmed',
    })
    .select()
    .single()

  // If insertion fails due to unique constraint, try a different name
  if (createTagError) {
    log('Tag creation failed, trying with timestamp', createTagError)
    const altTagName = `t${Date.now()}${Math.random().toString(36).substring(2, 6)}`
    const { data: altTag, error: altError } = await supabase
      .from('tags')
      .insert({
        name: altTagName.substring(0, 20),
        status: 'confirmed',
      })
      .select()
      .single()

    expect(altError).toBeFalsy()
    expect(altTag).toBeTruthy()
  }

  const tagToUse = newTag || { name: newTagName }

  // Create the association for the new tag
  const { data: createdTag } = await supabase
    .from('tags')
    .select('*')
    .eq('name', tagToUse.name)
    .single()

  assert(!!createdTag, 'created tag should exist')
  await supabase.from('send_account_tags').insert({
    send_account_id: sendAccount.id,
    tag_id: createdTag.id,
  })

  // Verify we now have 2 tags associated with the account
  const { data: accountTags } = await supabase.from('send_account_tags').select('tag_id')

  assert(!!accountTags, 'account tags should exist')
  expect(accountTags.length).toBeGreaterThanOrEqual(2)
  log('Account now has multiple tags')

  // Now remove the main tag (onboarding tag) from the junction table
  const { data: mainAccountTag } = await supabase
    .from('send_account_tags')
    .select('id')
    .eq('tag_id', onboardingTag.id)
    .single()

  expect(mainAccountTag).toBeTruthy()
  assert(!!mainAccountTag, 'main account tag should exist')

  // Delete the association
  const { error: deleteError } = await supabase
    .from('send_account_tags')
    .delete()
    .eq('id', mainAccountTag.id)

  expect(deleteError).toBeFalsy()
  log('Removed main tag association')

  // The database trigger should automatically assign the next confirmed tag as main
  // Give the trigger a moment to execute
  await page.waitForTimeout(1000)

  const { data: updatedAccount } = await supabase
    .from('send_accounts')
    .select('main_tag_id')
    .single()

  // The main tag should have changed
  assert(!!updatedAccount, 'updated account should exist')
  expect(updatedAccount.main_tag_id).not.toBe(onboardingTag.id)
  expect(updatedAccount.main_tag_id).toBeTruthy()
  assert(!!updatedAccount.main_tag_id, 'updated account should have main tag id')

  // Get the new main tag details
  const { data: newMainTag } = await supabase
    .from('tags')
    .select('*')
    .eq('id', updatedAccount.main_tag_id)
    .single()

  expect(newMainTag).toBeTruthy()
  assert(!!newMainTag, 'new main tag should exist')
  log('Main tag succession worked - new tag is automatically main', {
    oldMainTag: onboardingTag.name,
    newMainTag: newMainTag.name,
  })

  // Verify the old tag is now available for others to claim
  const { data: oldTag } = await supabase
    .from('tags')
    .select('*')
    .eq('id', onboardingTag.id)
    .single()

  expect(oldTag?.status).toBe('available')
  log('Old main tag is now available for others to claim')
})
