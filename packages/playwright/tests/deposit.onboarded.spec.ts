/**
 * Deposit page is primarly used for logged in users to initiate deposits.
 */

import { expect, test as sendAccountTest } from './fixtures/send-accounts'
import { test as ethereumTest } from './fixtures/ethereum'
import debug from 'debug'
import { mergeTests, type Page } from '@playwright/test'
import { Web3RequestKind } from 'headless-web3-provider'
import { assert } from 'app/utils/assert'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import { testBaseClient, usdcAddress } from './fixtures/viem'
import { hexToBytea } from 'app/utils/hexToBytea'

const test = mergeTests(sendAccountTest, ethereumTest)

let log: debug.Debugger

const lookupBalance = async ({
  address,
  tokenAddress,
}: { address: `0x${string}`; tokenAddress: `0x${string}` }) => {
  return await testBaseClient.readContract({
    address: tokenAddress,
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ type: 'address' }],
        outputs: [{ type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: [address],
  })
}

test('can deposit USDC with web3 wallet', async ({
  page,
  injectWeb3Provider,
  accounts,
  user: { profile },
  supabase,
}) => {
  log = debug(`test:activity:${profile.id}:${test.info().parallelIndex}`)
  const { data: sendAccount, error } = await supabase.from('send_accounts').select('*').single()
  expect(error).toBeFalsy()
  assert(!!sendAccount, 'no send account found')
  const wallet = await injectWeb3Provider()
  const account = accounts[0]
  const depositAmount = 10n * 10n ** 6n
  const tokenAddress = usdcAddress[testBaseClient.chain.id]
  assert(!!account, 'no web3 accounts found')
  log('account', account)

  const balance = await lookupBalance({ address: sendAccount.address, tokenAddress })

  // fund account
  await setERC20Balance({
    client: testBaseClient,
    address: account.address as `0x${string}`,
    tokenAddress,
    value: depositAmount,
  })
  log(
    'account balance',
    await testBaseClient.readContract({
      address: tokenAddress,
      abi: [
        {
          type: 'function',
          name: 'balanceOf',
          stateMutability: 'view',
          inputs: [{ type: 'address' }],
          outputs: [{ type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [account.address],
    })
  )

  await page.goto('/') // usdc

  const depositButton = page.getByRole('button', { name: 'Deposit' })
  await depositButton.click()
  await page.getByRole('link', { name: 'Deposit with Web3 Wallet' }).click()
  await page.waitForURL('/deposit/web3')
  await expect(page.getByTestId('rk-connect-header-label')).toBeVisible()

  await page.getByTestId('rk-wallet-option-injected').click()

  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(Web3RequestKind.RequestPermissions)
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(Web3RequestKind.RequestPermissions)
  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(Web3RequestKind.RequestAccounts)
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(Web3RequestKind.RequestAccounts)

  await expect(
    page.getByRole('heading', { name: `Depositing from ${account.address}` })
  ).toBeVisible()

  expect(await page.getByLabel('Token').inputValue()).toBe(usdcAddress[testBaseClient.chain.id])
  await page.getByLabel('Amount').fill('10')

  await expect(
    page.getByText('After depositing, your Send Account balance will be 110 USDC')
  ).toBeVisible()

  await depositButton.click()

  await expect(async () => {
    await expect(page.getByTestId('DepositWeb3ScreenError')).toBeHidden()
    expect(wallet.getPendingRequestCount(Web3RequestKind.SendTransaction)).toBe(1)
  }).toPass({
    timeout: 5000,
  })
  await wallet.authorize(Web3RequestKind.SendTransaction)

  await expect(depositButton).not.toBeDisabled()
  await expect(page.getByText(/View 0x[0-9a-f]{4}\.\.\.[0-9a-f]{3} on.+/i)).toBeVisible()

  expect(
    await testBaseClient.readContract({
      address: usdcAddress[testBaseClient.chain.id],
      abi: [
        {
          type: 'function',
          name: 'balanceOf',
          stateMutability: 'view',
          inputs: [{ type: 'address' }],
          outputs: [{ type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [sendAccount.address],
    })
  ).toBe(depositAmount + balance)

  await expect(
    async () =>
      await expect(supabase).toHaveEventInActivityFeed({
        event_name: 'send_account_transfers',
        to_user: {
          id: profile.id,
          send_id: profile.send_id,
        },
        data: {
          f: hexToBytea(account.address),
          t: hexToBytea(sendAccount.address),
          v: depositAmount.toString(),
          log_addr: hexToBytea(tokenAddress),
        },
      })
  ).toPass({
    timeout: 5000,
  })
})