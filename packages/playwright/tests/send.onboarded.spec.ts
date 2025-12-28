import { expect, test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { createUserWithoutTags, createUserWithTagsAndAccounts } from '@my/snaplet'
import type { Database } from '@my/supabase/database.types'
import { mergeTests, type Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { type coin, coins, ethCoin, sendCoin } from 'app/data/coins'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { shorten } from 'app/utils/strings'
import debug from 'debug'
import { parseUnits } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { ProfilePage } from './fixtures/profiles'
import { SendPage } from './fixtures/send'
import { fund, testBaseClient } from './fixtures/viem'

const test = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

test.beforeEach(async ({ user: { profile } }) => {
  log = debug(`test:send:${profile.id}:${test.info().parallelIndex}`)
})

const idTypes = ['tag', 'sendid', 'address'] as const

for (const token of [...coins, ethCoin]) {
  test(`can send ${token.symbol} starting from profile page`, async ({ page, seed, supabase }) => {
    const plan = await createUserWithTagsAndAccounts(seed)
    const tag = plan.tags[0]
    const profile = plan.profile
    const recvAccount = plan.sendAccount
    assert(!!tag?.name, 'tag not found')
    assert(!!profile?.name, 'profile name not found')
    assert(!!profile?.about, 'profile about not found')
    assert(!!recvAccount, 'send account not found')
    const profilePage = new ProfilePage(page, {
      name: profile.name,
      about: profile.about,
    })
    await profilePage.visit(tag.name, expect)
    await expect(profilePage.sendButton).toBeVisible()
    await profilePage.sendButton.click()

    await expect(page).toHaveURL(/\/send/)
    const url = new URL(page.url())
    expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({
      recipient: profile.send_id?.toString(),
      idType: 'sendid',
    })

    const counterparty = `/${tag.name}`
    await handleTokenTransfer({ token, supabase, page, counterparty, recvAccount, profile })
  })

  for (const idType of idTypes) {
    test(`can send ${token.symbol} using ${idType} starting from home page`, async ({
      page,
      seed,
      supabase,
    }) => {
      const isSendId = idType === 'sendid'
      const isAddress = idType === 'address'
      const plan = isSendId
        ? await createUserWithoutTags(seed) // no tags for send id
        : await createUserWithTagsAndAccounts(seed)
      const profile = plan.profile
      const tag = plan.tags[0]

      assert(!!profile, 'profile not found')
      assert(!!profile.name, 'profile name not found')
      assert(!!profile.send_id, 'profile send id not found')
      assert(!!plan.sendAccount, 'send account not found')

      const recvAccount: { address: `0x${string}` } = (() => {
        switch (idType) {
          case 'address':
            return { address: privateKeyToAccount(generatePrivateKey()).address }
          default:
            assert(!!plan.sendAccount, 'send account not found')
            return { address: plan.sendAccount.address as `0x${string}` }
        }
      })()

      const query = (() => {
        switch (idType) {
          case 'sendid':
            return profile?.send_id.toString()
          case 'address':
            return recvAccount.address
          default:
            return tag?.name
        }
      })()

      assert(!!query, 'query not found')

      // goto send page
      await page.goto('/')

      const sendLink = page.getByTestId('sidebar-nav-send')
      await expect(sendLink).toBeVisible()
      await sendLink.click()

      await expect(async () => {
        // fill search input - use placeholder instead of role name (accessible name != form field name)
        const searchInput = page.getByPlaceholder('Search')
        await expect(searchInput).toBeVisible()
        await searchInput.fill(query)
        await expect(searchInput).toHaveValue(query)
      }).toPass({
        timeout: 15_000,
      })

      // click user - address has role="link", tag/sendid are Stack with onPress
      const searchResult = isAddress
        ? page.getByTestId('searchResults').getByRole('link', { name: query, exact: false })
        : page.getByTestId('searchResults').getByText(query).first()
      await expect(searchResult).toBeVisible()
      await searchResult.click()

      if (isAddress) {
        // confirm sending to external address
        const dialog = page.getByTestId('address-send-dialog')
        await expect(dialog).toBeVisible()
        const confirmButton = dialog.getByRole('button', { name: 'I Agree & Continue' })
        await expect(confirmButton).toBeVisible()
        await confirmButton.click()
      }

      await expect(page).toHaveURL(/\/send/)

      await expect(() => {
        const url = new URL(page.url())
        expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({
          recipient: query,
          idType,
        })
      }).toPass({
        timeout: 5000,
      })

      // Verify the recipient info is visible (SendFormContainer may be hidden on smaller viewports)
      const expectedRecipient = isAddress ? shorten(recvAccount.address, 5, 4) : profile.name
      await expect(page.getByText(expectedRecipient)).toBeVisible()

      const counterparty = (() => {
        switch (idType) {
          case 'address':
            return recvAccount.address
          case 'sendid':
            return profile.name
          default:
            return `/${tag?.name}`
        }
      })()
      await handleTokenTransfer({
        token,
        supabase,
        page,
        counterparty,
        recvAccount,
        profile: isAddress ? undefined : profile,
      })
    })
  }
}

/**
 * Handles the transfer process for a specified token.
 *
 * @param {object} params - The parameters for the transfer process.
 * @param {object} params.token - The token details.
 * @param {string} params.token.symbol - The symbol of the token (e.g., 'ETH').
 * @param {string} params.token.address - The address of the token contract.
 * @param {number} params.token.decimals - The decimal precision of the token.
 * @param {SupabaseClient} params.supabase - The Supabase client instance for database interactions.
 * @param {Page} params.page - The Playwright page instance for browser interactions.
 * @param {object} params.counterparty - The counterparty name that shows up in the activity feed.
 * @param {object} params.recvAccount - The receiving account details.
 * @param {string} params.recvAccount.address - The Ethereum address of the receiving account.
 * @param {object} params.profile - The profile details for the account.
 * @param {string} params.profile.id - The profile ID.
 * @param {string} params.profile.send_id - The send ID of the profile.
 *
 * @returns {Promise<void>} Returns a promise that resolves when the transfer is completed.
 */
async function handleTokenTransfer({
  token,
  supabase,
  page,
  counterparty,
  recvAccount,
  profile,
}: {
  token: coin
  supabase: SupabaseClient<Database>
  page: Page
  counterparty: string
  recvAccount: { address: string }
  profile?: { id: string; send_id?: number }
}): Promise<void> {
  const isETH = token.symbol === 'ETH'
  const decimalAmount: string = (() => {
    const minXfrAmt = token.minXfrAmt ?? 0
    const randomAmount = Math.random() * 1000
    // Ensure amount is at least the minimum
    const amt = Math.max(randomAmount, minXfrAmt * 2)
      .toFixed(token.decimals)
      .toString()
    if (token.decimals > 0) {
      // trailing zeros are not allowed in the decimal part
      return amt.replace(/0+$/, '')
    }
    return amt
  })()
  const transferAmount = parseUnits(decimalAmount, token.decimals)
  const balanceBefore = transferAmount * 100n // padding

  const { data: sendAccount, error } = await supabase.from('send_accounts').select('*').single()
  expect(error).toBeFalsy()
  assert(!!sendAccount, 'no send account found')

  // fund account
  await fund({ address: sendAccount.address, amount: balanceBefore, coin: token })

  await page.reload() // ensure balance is updated on the page

  const sendPage = new SendPage(page, expect)
  await sendPage.expectTokenSelect(token.symbol)
  await sendPage.fillAndSubmitForm(decimalAmount)
  await sendPage.waitForSendingCompletion()
  await sendPage.expectNoSendError()

  await expect(async () => {
    await page.waitForURL(`/profile/${profile?.send_id}/history`, { timeout: 10_000 })

    if (isETH) {
      // just ensure balance is updated, since the send_account_receives event is not emitted
      expect(
        await testBaseClient.getBalance({
          address: recvAccount.address as `0x${string}`,
        })
      ).toBe(transferAmount)
    } else {
      // 1. Check if the indexed event exists in the database
      await expect(supabase).toHaveEventInActivityFeed({
        event_name: 'send_account_transfers',
        ...(profile ? { to_user: { id: profile.id, send_id: profile.send_id } } : {}),
        data: {
          t: hexToBytea(recvAccount.address as `0x${string}`),
          v: transferAmount.toString(),
        },
      })
    }
  }).toPass({
    // Increased timeout to allow for indexing and UI update
    timeout: 15000,
  })

  if (isETH) return // nothing else to check with eth because it won't show up in activity

  // FIXME: this needs to be updated to use the new profile history page
  // 2. Check if the UI has updated to show the indexed event (not the pending one)
  // const history = page.getByTestId('TokenActivityFeed')

  // await withRetry(
  //   async () => {
  //     await expect(history).toBeVisible({ timeout: 5_000 })

  //     const historyAmount = (() => {
  //       switch (token.symbol) {
  //         case 'USDC':
  //           return truncateDecimals(decimalAmount, 2)
  //         case 'SEND':
  //           return truncateDecimals(decimalAmount, 0)
  //         default:
  //           return decimalAmount
  //       }
  //     })()

  //     const isAddressCounterparty = isAddress(counterparty)

  //     // Ensure the correct amount and counterparty are visible
  //     await expect(history.getByText(`${historyAmount} ${token.symbol}`)).toBeVisible()
  //     await expect(
  //       history.getByText(isAddressCounterparty ? shorten(counterparty ?? '', 5, 4) : counterparty)
  //     ).toBeVisible()

  //     // Ensure Sent is visible
  //     await expect(history.getByText(isAddressCounterparty ? 'Withdraw' : 'Sent')).toBeVisible()
  //   },
  //   {
  //     shouldRetry: async () => {
  //       log('retrying history check')
  //       await page.reload() // FIXME: this is a hack to force the UI to update for some reason the activity is not showing up
  //       return true
  //     },
  //     retryCount: 10,
  //   }
  // )
}

const truncateDecimals = (amount: string, decimals: number) => {
  const index = amount.indexOf('.')

  if (index === -1) {
    return amount
  }

  return decimals === 0 ? amount.slice(0, index) : amount.slice(0, index + decimals + 1)
}

test('cannot send below minimum amount for SEND token', async ({ page, seed, supabase }) => {
  const plan = await createUserWithTagsAndAccounts(seed)
  const tag = plan.tags[0]
  const profile = plan.profile
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!plan.sendAccount, 'send account not found')

  const { data: sendAccount, error } = await supabase.from('send_accounts').select('*').single()
  expect(error).toBeFalsy()
  assert(!!sendAccount, 'no send account found')

  // Fund account with enough SEND
  const fundAmount = parseUnits('100', 18) // 100 SEND
  await fund({ address: sendAccount.address, amount: fundAmount, coin: sendCoin })

  // goto send page directly
  await page.goto('/')

  const sendLink = page.getByTestId('sidebar-nav-send')
  await expect(sendLink).toBeVisible()
  await sendLink.click()

  await expect(async () => {
    // fill search input - use placeholder instead of role name (accessible name != form field name)
    const searchInput = page.getByPlaceholder('Search')
    await expect(searchInput).toBeVisible()
    await searchInput.fill(tag.name)
    await expect(searchInput).toHaveValue(tag.name)
  }).toPass({
    timeout: 15_000,
  })

  // click user - tag search uses Stack with onPress, not Link
  const searchResult = page.getByTestId('searchResults').getByText(tag.name).first()
  await expect(searchResult).toBeVisible()
  await searchResult.click()

  await expect(page).toHaveURL(/\/send/)

  // Wait for URL parameters to be set
  await expect(() => {
    const url = new URL(page.url())
    expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({
      recipient: tag.name,
      idType: 'tag',
    })
  }).toPass({
    timeout: 5000,
  })

  // Wait for the recipient info to be visible (SendFormContainer may be hidden on smaller viewports)
  await expect(page.getByText(profile.name)).toBeVisible()

  await page.reload() // ensure balance is updated

  const sendPage = new SendPage(page, expect)
  await sendPage.expectTokenSelect('SEND')

  // Try to send below minimum (0.5 SEND, minimum is 1)
  await expect(sendPage.amountInput).toBeVisible()
  await sendPage.amountInput.fill('0.5')

  // Wait for validation to process
  await page.waitForTimeout(500)

  // Verify error message is displayed
  const minimumError = page.getByTestId('SendFormMinimumError')
  await expect(minimumError).toBeVisible()
  await expect(minimumError).toHaveText(/Minimum: 1 SEND/)

  // Verify continue button is disabled
  await expect(sendPage.continueButton).toBeVisible()
  await expect(sendPage.continueButton).toBeDisabled()

  // Now send exactly minimum amount (1 SEND) - should work
  await sendPage.amountInput.fill('1')
  await page.waitForTimeout(500)

  // Error message should disappear
  await expect(minimumError).toBeHidden()

  // Continue button should be enabled
  await expect(sendPage.continueButton).toBeEnabled()
})
