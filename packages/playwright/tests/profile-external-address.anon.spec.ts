import { test } from '@my/playwright/fixtures/snaplet'
import { createUserWithTagsAndAccounts } from '@my/snaplet'
import { expect } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import debug from 'debug'

let log: debug.Debugger

test.beforeAll(async () => {
  log = debug(`test:profile:external:${test.info().parallelIndex}`)
})

/**
 * Generates a random valid Ethereum address that is guaranteed not to have a Send account
 */
function generateExternalAddress(): `0x${string}` {
  return privateKeyToAddress(generatePrivateKey())
}

test.describe('External Address Profile - Anonymous User', () => {
  test('can view external address profile (no Send account)', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    log('Testing external address:', externalAddress)

    await page.goto(`/profile/${externalAddress}`)

    // Should show external address view, not 404
    await expect(page.getByTestId('externalAddress')).toBeVisible()
    await expect(page.getByTestId('externalAddress')).toHaveText('External Address')

    // Should show truncated address with copy button
    const truncatedAddress = `${externalAddress.slice(0, 6)}...${externalAddress.slice(-4)}`
    await expect(page.getByTestId('copyAddressButton')).toBeVisible()
    await expect(page.getByText(truncatedAddress)).toBeVisible()

    // Should NOT show on-chain balances section (hidden per spec)
    await expect(page.getByText('On-chain Balances (Base)')).not.toBeVisible()

    // Should show Activity section instead of balances
    await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeVisible()

    // Should show send button
    await expect(page.getByTestId('externalAddressSendButton')).toBeVisible()

    // Activity history is shown directly on the page (no extra links needed)
    // Should show sign in prompt for anonymous user
    await expect(page.getByText('Sign in to view your activity with this address.')).toBeVisible()
  })

  test('redirects to canonical URL when address has public Send account', async ({
    page,
    seed,
    pg,
  }) => {
    // Create a user with a public profile
    const plan = await createUserWithTagsAndAccounts(seed, { isPublic: true })
    const tag = plan.tags[0]
    const account = plan.sendAccount
    assert(!!tag, 'tag not found')
    assert(!!account, 'send account not found')
    assert(!!account.address, 'send account address not found')

    // Ensure the send_account is active
    await pg.query(
      `
      UPDATE send_accounts
      SET deleted_at = NULL, init_code = 'a'
      WHERE id = $1
    `,
      [account.id]
    )

    log('Testing address with public Send account:', account.address)
    log('Expected redirect to tag:', tag.name)

    // Visit the profile by address
    await page.goto(`/profile/${account.address}`)

    // Should redirect to the canonical URL (tag-based)
    await expect(async () => {
      const url = page.url()
      // Should redirect to either /{tag} or /profile/{sendid}
      expect(url.endsWith(`/${tag.name}`) || url.includes(`/profile/${plan.profile.send_id}`)).toBe(
        true
      )
    }).toPass()

    // Should show the profile, not external address view
    await expect(page.getByTestId('externalAddress')).not.toBeVisible()
  })

  test('shows 404 when address has private Send account (anonymous user)', async ({
    page,
    seed,
    pg,
  }) => {
    // Create a user with a private profile
    const plan = await createUserWithTagsAndAccounts(seed, { isPublic: false })
    const account = plan.sendAccount
    assert(!!account, 'send account not found')
    assert(!!account.address, 'send account address not found')

    // Ensure the send_account is active
    await pg.query(
      `
      UPDATE send_accounts
      SET deleted_at = NULL, init_code = 'a'
      WHERE id = $1
    `,
      [account.id]
    )

    log('Testing address with private Send account:', account.address)

    // Visit the profile by address
    await page.goto(`/profile/${account.address}`)

    // Should show 404, not reveal that an account exists
    await expect(async () => {
      const title = await page.title()
      expect(title).toBe('Send | 404')
    }).toPass()

    await expect(page.getByRole('heading', { name: 'Not found.' })).toBeVisible()
  })

  test('shows 404 for invalid 0x address (wrong length)', async ({ page }) => {
    // Invalid address - too short
    const invalidAddress = '0x1234567890'

    await page.goto(`/profile/${invalidAddress}`)

    // Should show 404
    await expect(async () => {
      const title = await page.title()
      expect(title).toBe('Send | 404')
    }).toPass()

    await expect(page.getByRole('heading', { name: 'Not found.' })).toBeVisible()
  })

  test('shows 404 for invalid 0x address (invalid characters)', async ({ page }) => {
    // Invalid address - contains invalid hex characters
    const invalidAddress = '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG'

    await page.goto(`/profile/${invalidAddress}`)

    // Should show 404
    await expect(async () => {
      const title = await page.title()
      expect(title).toBe('Send | 404')
    }).toPass()

    await expect(page.getByRole('heading', { name: 'Not found.' })).toBeVisible()
  })
})

test.describe('External Address History - Anonymous User', () => {
  test('can view external address history page (no Send account)', async ({ page }) => {
    const externalAddress = generateExternalAddress()
    log('Testing external address history:', externalAddress)

    await page.goto(`/profile/${externalAddress}/history`)

    // Should show history page, not 404
    await expect(page.getByTestId('externalAddressHistory')).toBeVisible()
    await expect(page.getByTestId('externalAddressHistory')).toHaveText('Address History')

    // Should show truncated address
    const truncatedAddress = `${externalAddress.slice(0, 6)}...${externalAddress.slice(-4)}`
    await expect(page.getByText(truncatedAddress)).toBeVisible()

    // Should prompt to sign in to view activity (since we're anonymous)
    await expect(page.getByText('Sign in to view your activity with this address.')).toBeVisible()

    // Should show send button
    await expect(page.getByTestId('externalAddressSendButton')).toBeVisible()

    // Should show back to profile link
    await expect(page.getByText('Back to Profile')).toBeVisible()

    // Should show Basescan link
    await expect(page.getByText('View on Basescan')).toBeVisible()
  })

  test('redirects to canonical history URL when address has public Send account', async ({
    page,
    seed,
    pg,
  }) => {
    // Create a user with a public profile
    const plan = await createUserWithTagsAndAccounts(seed, { isPublic: true })
    const account = plan.sendAccount
    assert(!!account, 'send account not found')
    assert(!!account.address, 'send account address not found')

    // Ensure the send_account is active
    await pg.query(
      `
      UPDATE send_accounts
      SET deleted_at = NULL, init_code = 'a'
      WHERE id = $1
    `,
      [account.id]
    )

    log('Testing history for address with public Send account:', account.address)

    // Visit the history page by address
    await page.goto(`/profile/${account.address}/history`)

    // Should redirect to the canonical history URL
    await expect(async () => {
      const url = page.url()
      expect(url).toContain(`/profile/${plan.profile.send_id}/history`)
    }).toPass()

    // Should not show external address history view
    await expect(page.getByTestId('externalAddressHistory')).not.toBeVisible()
  })

  test('shows 404 for history when address has private Send account', async ({
    page,
    seed,
    pg,
  }) => {
    // Create a user with a private profile
    const plan = await createUserWithTagsAndAccounts(seed, { isPublic: false })
    const account = plan.sendAccount
    assert(!!account, 'send account not found')
    assert(!!account.address, 'send account address not found')

    // Ensure the send_account is active
    await pg.query(
      `
      UPDATE send_accounts
      SET deleted_at = NULL, init_code = 'a'
      WHERE id = $1
    `,
      [account.id]
    )

    log('Testing history for address with private Send account:', account.address)

    // Visit the history page by address
    await page.goto(`/profile/${account.address}/history`)

    // Should show 404
    await expect(async () => {
      const title = await page.title()
      expect(title).toBe('Send | 404')
    }).toPass()

    await expect(page.getByRole('heading', { name: 'Not found.' })).toBeVisible()
  })

  test('shows 404 for history with invalid 0x address', async ({ page }) => {
    const invalidAddress = '0x123'

    await page.goto(`/profile/${invalidAddress}/history`)

    // Should show 404
    await expect(async () => {
      const title = await page.title()
      expect(title).toBe('Send | 404')
    }).toPass()

    await expect(page.getByRole('heading', { name: 'Not found.' })).toBeVisible()
  })
})
