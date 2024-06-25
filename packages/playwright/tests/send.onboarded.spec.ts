import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { debug, type Debugger } from 'debug'
import { assert } from 'app/utils/assert'
import { userOnboarded } from '@my/snaplet/src/models'
import { ProfilePage } from './fixtures/profiles'
import { erc20Abi, formatUnits, parseUnits, zeroAddress } from 'viem'
import { sendTokenAddresses, testBaseClient, usdcAddress } from './fixtures/viem'
import { SendPage } from './fixtures/send'
import { hexToBytea } from 'app/utils/hexToBytea'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'

const test = mergeTests(sendAccountTest, snapletTest)

let log: Debugger

test.beforeEach(async ({ user: { profile }, supabase }) => {
  log = debug(`test:send:${profile.id}:${test.info().parallelIndex}`)
})

// this wouldn't be necessary if playwright supported ESM or we transpiled the tests, or @my/wagmi
const tokens = [
  {
    symbol: 'USDC',
    address: usdcAddress[testBaseClient.chain.id],
    decimals: 6,
  },
  {
    symbol: 'ETH',
    address: 'eth',
    decimals: 18,
  },
  {
    symbol: 'SEND',
    address: sendTokenAddresses[testBaseClient.chain.id],
    decimals: 0,
  },
] as { symbol: string; address: `0x${string}`; decimals: number }[]

for (const token of tokens) {
  test(`can send ${token.symbol} starting from profile page`, async ({ page, seed, supabase }) => {
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
        tokenAddress: token.address,
        value: balanceBefore, // padding
      })
    }

    const plan = await seed.users([userOnboarded])
    const tag = plan.tags[0]
    const profile = plan.profiles[0]
    const recvAccount = plan.sendAccounts[0]
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
            to_user: {
              id: profile.id,
              send_id: profile.sendId,
            },
            data: {
              t: hexToBytea(recvAccount.address as `0x${string}`),
              v: transferAmount.toString(),
            },
          })
    ).toPass({
      timeout: isETH ? 10000 : 5000, // eth needs more time since no send_account_receives event is emitted
    })

    await expect(page).toHaveURL(`/?token=${token.address}`)

    if (!isETH) {
      // no history for eth since no send_account_receives event is emitted
      const history = page.getByTestId('TokenDetailsHistory')
      await expect(history).toBeVisible()
      await expect(history.getByText(`${decimalAmount} ${token.symbol}`)).toBeVisible()
      await expect(history.getByText(`@${tag.name}`)).toBeVisible()
    }
  })
}

test.skip('can send USDC to user on profile', async ({ page, seed }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, {
    name: profile.name,
    about: profile.about,
  })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()

  // @todo create send form fixture
  const sendDialog = page.getByTestId('sendDialogContainer')
  await expect(sendDialog).toBeVisible()
  const amountInput = sendDialog.getByLabel('Amount')
  await expect(amountInput).toBeVisible()
  await amountInput.fill('5')
  const tokenSelect = sendDialog.getByRole('combobox') // @todo when tamagui supports this , { name: 'Token' })
  await expect(tokenSelect).toBeVisible()
  await tokenSelect.selectOption('USDC')
  const sendDialogButton = sendDialog.getByRole('button', { name: 'Send' })
  expect(sendDialogButton).toBeVisible()
  await sendDialogButton.click()
  await expect(sendDialog.getByText(/Sent user op [0-9a-f]+/).first()).toBeVisible({
    timeout: 20000,
  })
  await expect(sendDialog.getByRole('link', { name: 'View on Otterscan' })).toBeVisible()
})

test.skip('can send USDC to user on profile using paymaster', async ({
  page,
  seed,
  supabase,
  setEthBalance,
}) => {
  const { data: sendAccount, error } = await supabase.from('send_accounts').select('*').single()
  if (error) {
    log('error fetching send account', error)
    throw error
  }
  assert(!!sendAccount, 'no send account found')
  assert(sendAccount.address !== zeroAddress, 'send account address is zero')

  await setEthBalance({ address: sendAccount.address, value: 0n }) // set balance to 0 ETH

  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, {
    name: profile.name,
    about: profile.about,
  })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()

  // @todo create send form fixture
  const sendDialog = page.getByTestId('sendDialogContainer')
  await expect(sendDialog).toBeVisible()
  const amountInput = sendDialog.getByLabel('Amount')
  await expect(amountInput).toBeVisible()
  await amountInput.fill('5')
  const tokenSelect = sendDialog.getByRole('combobox') // @todo when tamagui supports this , { name: 'Token' })
  await expect(tokenSelect).toBeVisible()
  await tokenSelect.selectOption('USDC')
  const sendDialogButton = sendDialog.getByRole('button', { name: 'Send' })
  expect(sendDialogButton).toBeVisible()
  const usdcBalBefore = await testBaseClient.readContract({
    address: usdcAddress[testBaseClient.chain.id],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [sendAccount.address],
  })
  await sendDialogButton.click()
  await expect(sendDialog.getByText(/Sent user op [0-9a-f]+/).first()).toBeVisible({
    timeout: 20000,
  })
  await expect(sendDialog.getByRole('link', { name: 'View on Otterscan' })).toBeVisible()

  const usdcBalAfter = await testBaseClient.readContract({
    address: usdcAddress[testBaseClient.chain.id],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [sendAccount.address],
  })
  expect(Number(formatUnits(usdcBalBefore, 6)) - Number(formatUnits(usdcBalAfter, 6))).toBeCloseTo(
    5,
    0
  ) // allow for ¢10 for gas
})
