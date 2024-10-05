import { expect, test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { userOnboarded } from '@my/snaplet/models'
import type { Database } from '@my/supabase/database.types'
import { mergeTests, type Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { coins, type coin } from 'app/data/coins'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { shorten } from 'app/utils/strings'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import debug from 'debug'
import { parseUnits } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { ProfilePage } from './fixtures/profiles'
import { SendPage } from './fixtures/send'
import { testBaseClient } from './fixtures/viem'

const test = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

test.beforeEach(async ({ user: { profile }, supabase }) => {
  log = debug(`test:send:${profile.id}:${test.info().parallelIndex}`)
})

const idTypes = ['tag', 'sendid', 'address'] as const

for (const token of coins) {
  test(`can send ${token.symbol} starting from profile page`, async ({ page, seed, supabase }) => {
    const plan = await seed.users([userOnboarded])
    const tag = plan.tags[0]
    const profile = plan.profiles[0]
    const recvAccount = plan.send_accounts[0]
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
      recipient: tag.name,
      idType: 'tag',
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
      const plan = await seed.users(
        isSendId
          ? [{ ...userOnboarded, tags: [] }] // no tags for send id
          : [userOnboarded]
      )
      const profile = plan.profiles[0]
      const tag = plan.tags[0]

      assert(!!profile, 'profile not found')
      assert(!!profile.name, 'profile name not found')
      assert(!!profile.send_id, 'profile send id not found')
      assert(!!plan.send_accounts[0], 'send account not found')

      const recvAccount: { address: `0x${string}` } = (() => {
        switch (idType) {
          case 'address':
            return { address: privateKeyToAccount(generatePrivateKey()).address }
          default:
            assert(!!plan.send_accounts[0], 'send account not found')
            return { address: plan.send_accounts[0].address as `0x${string}` }
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

      //Press send button
      await page.getByTestId('homeSendButton').first().click()

      // fill search input
      const searchInput = page.getByRole('search', { name: 'query' })
      expect(searchInput).toBeVisible()
      await searchInput.fill(query)
      await expect(searchInput).toHaveValue(query)

      // click user
      const searchResult = page
        .getByTestId('searchResults')
        .getByRole('link', { name: query, exact: false })
      await expect(searchResult).toBeVisible()
      await searchResult.click()

      if (isAddress) {
        // confirm sending to external address
        const dialog = page.getByRole('dialog', { name: 'Confirm External Send' })
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

      await expect(page.getByTestId('SendForm')).toHaveText(
        new RegExp(
          (() => {
            switch (idType) {
              case 'address':
                return shorten(recvAccount.address, 5, 4)
              case 'sendid':
                return `#${profile.send_id}`
              default:
                return `/${tag?.name}`
            }
          })()
        )
      )

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
  const decimalAmount = (Math.random() * 1000).toFixed(token.decimals).toString()
  const transferAmount = parseUnits(decimalAmount, token.decimals)
  const balanceBefore = transferAmount * 10n // padding

  const { data: sendAccount, error } = await supabase.from('send_accounts').select('*').single()
  expect(error).toBeFalsy()
  assert(!!sendAccount, 'no send account found')

  // fund account
  if (isETH) {
    await testBaseClient.setBalance({
      address: sendAccount.address as `0x${string}`,
      value: balanceBefore, // padding
    })
  } else {
    await setERC20Balance({
      client: testBaseClient,
      address: sendAccount.address as `0x${string}`,
      tokenAddress: token.token as `0x${string}`,
      value: balanceBefore, // padding
    })
  }

  const sendPage = new SendPage(page, expect)
  await sendPage.expectTokenSelect(token.symbol)
  await sendPage.fillAndSubmitForm(decimalAmount)
  await sendPage.waitForSendingCompletion()
  await sendPage.expectNoSendError()

  await expect(async () =>
    isETH
      ? // just ensure balance is updated, since the send_account_receives event is not emitted
        expect(
          await testBaseClient.getBalance({
            address: recvAccount.address as `0x${string}`,
          })
        ).toBe(transferAmount)
      : await expect(supabase).toHaveEventInActivityFeed({
          event_name: 'send_account_transfers',
          ...(profile ? { to_user: { id: profile.id, send_id: profile.send_id } } : {}),
          data: {
            t: hexToBytea(recvAccount.address as `0x${string}`),
            v: transferAmount.toString(),
          },
        })
  ).toPass({
    timeout: isETH ? 10000 : 5000, // eth needs more time since no send_account_receives event is emitted
  })

  await expect(page).toHaveURL(`/?token=${token.token}`, { timeout: isETH ? 10_000 : undefined }) // sometimes ETH needs more time

  if (!isETH) {
    // no history for eth since no send_account_receives event is emitted
    const history = page.getByTestId('TokenDetailsHistory')
    await expect(history).toBeVisible()
    await expect(history.getByText(`${decimalAmount} ${token.symbol}`)).toBeVisible()
    await expect(history.getByText(counterparty)).toBeVisible()
  }
}
