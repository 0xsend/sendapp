/**
 * Deposit page is primarly used for logged in users to initiate deposits.
 */

import HeadlessWeb3Provider from '@0xbigboss/headless-web3-provider'
import { usdcAddress } from '@my/wagmi'
import { mergeTests } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import debug from 'debug'
import { parseEther } from 'viem'
import { test as ethereumTest } from './fixtures/ethereum'
import { expect, test as sendAccountTest } from './fixtures/send-accounts'
import { lookupBalance, testBaseClient } from './fixtures/viem'

const test = mergeTests(sendAccountTest, ethereumTest)

let log: debug.Debugger

test.skip('can deposit USDC with web3 wallet', async ({
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

  const balance = await lookupBalance({ address: sendAccount.address, token: tokenAddress })

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
  const depositWeb3Link = page.getByRole('link', { name: 'Deposit with Web3 Wallet' })
  await expect(depositWeb3Link).toBeVisible()
  await depositWeb3Link.click()
  await page.waitForURL('/deposit/web3')
  await expect(page.locator('w3m-modal')).toBeVisible()
  const connectButton = await page.locator('w3m-button')
  await connectButton.click()
  await page.locator('w3m-connect-injected-widget').click()

  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(
          HeadlessWeb3Provider.Web3RequestKind.RequestPermissions
        )
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.RequestPermissions)
  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(HeadlessWeb3Provider.Web3RequestKind.RequestAccounts)
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.RequestAccounts)

  await expect(page.getByText('10 USDC')).toBeVisible()

  expect(await page.getByLabel('Token').inputValue()).toBe(usdcAddress[testBaseClient.chain.id])
  await page.getByLabel('Amount').fill('10')

  await expect(
    page.getByText('After depositing, your Send Account balance will be 110 USDC')
  ).toBeVisible()

  await depositButton.click()

  await expect(async () => {
    await expect(page.getByTestId('DepositWeb3ScreenError')).toBeHidden()
    expect(
      wallet.getPendingRequestCount(HeadlessWeb3Provider.Web3RequestKind.SendTransaction)
    ).toBe(1)
  }).toPass({
    timeout: 5000,
  })
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.SendTransaction)

  await expect(depositButton).not.toBeDisabled({ timeout: 10000 }) // wait for tx to be mined
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

test.skip('can deposit ETH with web3 wallet', async ({
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
  const depositAmount = parseEther('0.01')
  const tokenAddress = usdcAddress[testBaseClient.chain.id]
  assert(!!account, 'no web3 accounts found')
  log('account', account)

  const balance = await testBaseClient.getBalance({
    address: sendAccount.address,
  })

  // fund account
  await testBaseClient.setBalance({
    address: account.address as `0x${string}`,
    value: depositAmount + parseEther('0.005'), // add some eth for gas
  })

  log(
    'account balance',
    await testBaseClient.getBalance({
      address: account.address as `0x${string}`,
    })
  )

  await page.goto('/') // usdc

  const depositButton = page.getByRole('button', { name: 'Deposit' })
  await depositButton.click()
  const depositWeb3Button = page.getByRole('link', { name: 'Deposit with Web3 Wallet' })
  await expect(depositWeb3Button).toBeVisible()
  await depositWeb3Button.click()
  await page.waitForURL('/deposit/web3')
  await expect(page.locator('w3m-modal')).toBeVisible()
  const connectButton = await page.locator('w3m-button')
  await connectButton.click()
  await page.locator('w3m-connect-injected-widget').click()

  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(
          HeadlessWeb3Provider.Web3RequestKind.RequestPermissions
        )
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.RequestPermissions)
  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(HeadlessWeb3Provider.Web3RequestKind.RequestAccounts)
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.RequestAccounts)

  const tokenSelect = page.getByLabel('Token')
  await page.getByLabel('Token').selectOption('eth')
  expect(await tokenSelect.inputValue()).toBe('eth')
  await page.getByLabel('Amount').fill('0.01')

  await expect(
    page.getByText('After depositing, your Send Account balance will be 1.01 ETH')
  ).toBeVisible()

  await depositButton.click()

  await expect(async () => {
    await expect(page.getByTestId('DepositWeb3ScreenError')).toBeHidden()
    expect(
      wallet.getPendingRequestCount(HeadlessWeb3Provider.Web3RequestKind.SendTransaction)
    ).toBe(1)
  }).toPass({
    timeout: 5000,
  })
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.SendTransaction)

  await expect(depositButton).not.toBeDisabled({ timeout: 10000 }) // wait for tx to be mined
  await expect(page.getByText(/View 0x[0-9a-f]{4}\.\.\.[0-9a-f]{3} on.+/i)).toBeVisible()

  expect(
    await testBaseClient.getBalance({
      address: sendAccount.address,
    })
  ).toBe(depositAmount + balance)

  await expect(
    async () =>
      await expect(supabase).toHaveEventInActivityFeed({
        event_name: 'send_account_receives',
        to_user: {
          id: profile.id,
          send_id: profile.send_id,
        },
        data: {
          sender: hexToBytea(account.address),
          value: depositAmount.toString(),
        },
      })
  ).toPass({
    timeout: 10000,
  })
})

test.skip('can connect and disconnect using wallet button', async ({
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
  assert(!!account, 'no web3 accounts found')
  log('account', account)

  await page.goto('/deposit/web3')

  const connectButton = await page.locator('w3m-button')
  expect(connectButton).toHaveText('Connect Wallet')
  await connectButton.click()
  await page.locator('w3m-connect-injected-widget').click()

  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(
          HeadlessWeb3Provider.Web3RequestKind.RequestPermissions
        )
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.RequestPermissions)
  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(HeadlessWeb3Provider.Web3RequestKind.RequestAccounts)
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.RequestAccounts)
  const walletButton = page.getByTestId('account-button')
  await expect(walletButton).toBeVisible()
  await walletButton.click()
  await page.getByRole('button', { name: 'Disconnect' }).click()
  expect(page.locator('w3m-button')).toHaveText('Connect Wallet')
})

test.skip('must switch to supported network', async ({
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
  assert(!!account, 'no web3 accounts found')
  log('account', account)

  await page.goto('/deposit/web3')

  const walletButton = page.locator('w3m-button')
  expect(walletButton).toHaveText('Connect Wallet')
  await walletButton.click()
  await page.locator('w3m-connect-injected-widget').click()

  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(
          HeadlessWeb3Provider.Web3RequestKind.RequestPermissions
        )
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.RequestPermissions)
  await expect
    .poll(
      async () => {
        return wallet.getPendingRequestCount(HeadlessWeb3Provider.Web3RequestKind.RequestAccounts)
      },
      {
        timeout: 5000,
        message: 'Did not receive accounts request',
      }
    )
    .toBe(1)
  await wallet.authorize(HeadlessWeb3Provider.Web3RequestKind.RequestAccounts)

  await expect(walletButton).toContainText('0.000')

  wallet.addNetwork(1, 'https://eth.public-rpc.com')
  wallet.switchNetwork(1)
  await expect(page.getByTestId('account-button')).toContainText('Switch Network')
  await expect(page.getByRole('heading', { name: 'Switch to Base Localhost' })).toBeVisible()
  await expect(page.getByTestId('SubmitButton')).toHaveCount(0)
})
