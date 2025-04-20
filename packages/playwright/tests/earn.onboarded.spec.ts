import { faker } from '@faker-js/faker'
import { expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import type { Database, PgBytea, Tables } from '@my/supabase/database.types'
import {
  sendEarnAbi,
  sendEarnAddress,
  sendEarnUsdcFactoryAbi,
  sendEarnUsdcFactoryAddress,
} from '@my/wagmi'
import { mergeTests, type Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { type erc20Coin, ethCoin, usdcCoin } from 'app/data/coins'
import { AffiliateVaultSchema } from 'app/features/earn/zod'
import { assert } from 'app/utils/assert'
import { byteaToHex } from 'app/utils/byteaToHex'
import formatAmount from 'app/utils/formatAmount'
import { hexToBytea } from 'app/utils/hexToBytea'
import { mulDivDown, WAD } from 'app/utils/math'
import { assetsToEarnFactory } from 'app/utils/sendEarn'
import { throwIf } from 'app/utils/throwIf'
import { Events } from 'app/utils/zod/activity'
import debug from 'debug'
import {
  BaseError,
  checksumAddress,
  ContractFunctionRevertedError,
  formatUnits,
  type LocalAccount,
  parseEther,
  parseGwei,
  withRetry,
} from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { readContract } from 'viem/actions'
import { coinToParam, test as earnTest, type EarnWithdrawPage } from './fixtures/earn'
import { checkReferralCodeHidden, checkReferralCodeVisibility } from './fixtures/referrals'
import { fund, testBaseClient } from './fixtures/viem'
import { createBaseWalletClient } from './fixtures/viem/base'

let log: debug.Debugger

// $25
const GAS_FEES = BigInt(25 * 10 ** usdcCoin.decimals)

const test = mergeTests(earnTest, snapletTest)

const readSendEarnBalanceOf = async ({
  vault,
  owner,
}: {
  vault: `0x${string}`
  owner: `0x${string}`
}) => {
  return readContract(testBaseClient, {
    address: vault,
    abi: sendEarnAbi,
    functionName: 'balanceOf',
    args: [owner],
  })
}

const readSendEarnConvertToAssets = async ({
  vault,
  shares,
}: {
  vault: `0x${string}`
  shares: bigint
}) => {
  return readContract(testBaseClient, {
    address: vault,
    abi: sendEarnAbi,
    functionName: 'convertToAssets',
    args: [shares],
  })
}

const readSendEarnDecimals = async ({
  vault,
}: {
  vault: `0x${string}`
}) => {
  return readContract(testBaseClient, {
    address: vault,
    abi: sendEarnAbi,
    functionName: 'decimals',
    args: [],
  })
}

const depositOnBehalfOf = async ({
  asset,
  account,
  receiver,
  amount,
  vault,
}: {
  asset: `0x${string}`
  account: LocalAccount
  receiver: `0x${string}`
  amount: bigint
  vault: `0x${string}`
}) => {
  const wallet = createBaseWalletClient({
    account,
  })
  const { request: approveReq } = await testBaseClient.simulateContract({
    account,
    address: asset,
    abi: sendEarnAbi,
    functionName: 'approve',
    args: [vault, amount],
    gas: parseGwei('0.1'),
  })
  const approveHash = await wallet.writeContract(approveReq)
  const approveReceipt = await testBaseClient.waitForTransactionReceipt({
    hash: approveHash,
    timeout: 5_000,
  })
  expect(approveReceipt.status).toBe('success')
  log('approveReceipt', approveReceipt)
  const { request: depositReq } = await testBaseClient.simulateContract({
    account,
    address: vault,
    abi: sendEarnAbi,
    functionName: 'deposit',
    args: [amount, receiver],
    gas: parseGwei('0.1'),
  })
  const depositHash = await wallet.writeContract(depositReq)
  const depositReceipt = await testBaseClient.waitForTransactionReceipt({
    hash: depositHash,
    timeout: 5_000,
  })
  expect(depositReceipt.status).toBe('success')
  log('depositReceipt', depositReceipt)
}

const readSendEarnSplit = async (coin: erc20Coin) => {
  const address = assetsToEarnFactory[coin.token]
  assert(!!address, 'Asset is not supported')
  return readContract(testBaseClient, {
    address: address,
    abi: sendEarnUsdcFactoryAbi,
    functionName: 'split',
    args: [],
  })
}

const verifyDeposit = async ({
  owner,
  vault,
  minDepositedAssets,
  depositedAssets,
  deposit,
}: {
  owner: `0x${string}`
  vault: `0x${string}`
  minDepositedAssets: bigint
  depositedAssets: bigint
  deposit: {
    owner: `\\x${string}`
    shares: string
    assets: string
    log_addr: `\\x${string}`
  }
}) => {
  const shares = await readSendEarnBalanceOf({
    vault,
    owner,
  })
  const assets = await readSendEarnConvertToAssets({
    vault,
    shares,
  })
  const decimals = await readSendEarnDecimals({
    vault,
  })

  // assets must equal to the amount deposited
  log('assets', { assets, diff: depositedAssets - assets })

  const depositedAssetsDecimals = Number(formatUnits(depositedAssets, 6))
  const dbAssets = BigInt(deposit.assets)
  const dbShares = BigInt(deposit.shares)
  const dbSharesDecimals = Number(formatUnits(dbShares, decimals))

  expect(Number(formatUnits(assets, 6))).toBeCloseTo(depositedAssetsDecimals, 2)
  expect(minDepositedAssets).toBeGreaterThanOrEqual(depositedAssets - assets)
  expect(Number(formatUnits(dbAssets, 6))).toBeCloseTo(depositedAssetsDecimals, -2) // Looser precision due to potential rounding

  expect(deposit.shares).toBeDefined()
  expect(BigInt(deposit.shares)).toBeGreaterThan(BigInt(0))
  expect(Number(formatUnits(dbShares, decimals))).toBeCloseTo(dbSharesDecimals, -2) // Looser precision due to potential rounding
}

const createSendEarn = async ({
  account,
  affiliate,
  coin,
}: {
  account: LocalAccount
  affiliate: `0x${string}`
  coin: erc20Coin
}) => {
  const wallet = createBaseWalletClient({
    account,
  })
  const factory = assetsToEarnFactory[coin.token]
  assert(!!factory, 'Asset is not supported')
  const salt = generatePrivateKey()
  const { request } = await wallet
    .simulateContract({
      address: factory,
      abi: sendEarnUsdcFactoryAbi,
      functionName: 'createSendEarn',
      args: [affiliate, salt],
      gas: parseGwei('0.1'),
    })
    .catch((err) => {
      log('createSendEarn error', err)
      if (err instanceof BaseError) {
        const revertError = err.walk((err) => err instanceof ContractFunctionRevertedError)
        if (revertError instanceof ContractFunctionRevertedError) {
          const errorName = revertError.data?.errorName ?? ''
          log('createSendEarn revert error', errorName, revertError.details)
        }
      }
      throw err
    })
  const hash = await wallet.writeContract(request)
  const receipt = await testBaseClient.waitForTransactionReceipt({ hash, timeout: 5_000 })
  assert(receipt.status === 'success', 'createSendEarn failed')
}

// can remove this once we deploy the new send earn contracts
test.beforeEach(async () => {
  // ensure the SendEarnFactory is deployed
  await testBaseClient.readContract({
    address: sendEarnUsdcFactoryAddress[testBaseClient.chain.id],
    abi: sendEarnUsdcFactoryAbi,
    functionName: 'VAULT',
  })
})

for (const coin of [usdcCoin]) {
  // $100K
  const MAX_DEPOSIT_AMOUNT = BigInt(100_000 * 10 ** coin.decimals)
  // $10
  const MIN_DEPOSIT_AMOUNT = BigInt(10 * 10 ** coin.decimals)
  let randomAmount: bigint

  test.describe(`Deposit ${coin.symbol}`, () => {
    test.beforeEach(async ({ user: { profile }, earnDepositPage: page, sendAccount }) => {
      log = debug(`test:earn:deposit:${profile.id}:${test.info().parallelIndex}`)
      randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
      await fund({ address: sendAccount.address, amount: randomAmount + GAS_FEES, coin })
      await page.navigate(coin)
    })

    test(`can deposit ${coin.symbol} into Platform SendEarn`, async ({
      earnDepositPage: page,
      sendAccount,
      supabase,
    }) => {
      const amountDecimals = formatUnits(randomAmount, coin.decimals)

      const deposit = await page.deposit({
        coin,
        supabase,
        amount: amountDecimals,
      })

      await verifyDeposit({
        owner: sendAccount.address,
        vault: sendEarnAddress[testBaseClient.chain.id],
        minDepositedAssets: MIN_DEPOSIT_AMOUNT,
        depositedAssets: randomAmount,
        deposit,
      })

      await verifyActivity({
        page: page.page,
        assets: BigInt(deposit.assets),
        coin,
        event: 'Deposit',
      })

      await verifyEarnings({
        page: page.page,
        coin,
        assets: BigInt(deposit.assets),
        event: 'Deposit',
      })
    })

    test(`can deposit ${coin.symbol} into SendEarn with a referral code`, async ({
      earnDepositPage: page,
      sendAccount,
      supabase,
      user: { profile },
      referrer: { referrer, referrerTags, referrerSendAccount },
    }) => {
      log = debug(`test:earn:deposit:referrer:${profile.id}:${test.info().parallelIndex}`)
      // Generate a random deposit amount
      const randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
      const amountDecimals = formatUnits(randomAmount, coin.decimals)

      // Set USDC balance for the test user
      await fund({ address: sendAccount.address, amount: randomAmount + GAS_FEES, coin })

      // Navigate to the earn page with the referral code
      await page.page.goto(`/?referral=${referrer.referral_code}`)
      await page.page.waitForURL(`/?referral=${referrer.referral_code}`)
      await page.navigate(coin)

      // Check if the referral code is visible and applied
      await checkReferralCodeVisibility({ page: page.page, referralCode: referrer.referral_code })

      log('depositing', amountDecimals, `${coin.symbol} with referral code`, referrer.referral_code)

      // Complete the deposit
      const deposit = await page.deposit({
        coin,
        supabase,
        amount: amountDecimals,
      })

      // vault is the log_addr which should be the Send Earn address where the
      // fee recipient is the send earn affiliate
      const vault = checksumAddress(byteaToHex(deposit.log_addr))

      await verifyDeposit({
        owner: sendAccount.address,
        vault,
        minDepositedAssets: MIN_DEPOSIT_AMOUNT,
        depositedAssets: randomAmount,
        deposit,
      })

      await verifyDepositAffiliateVault({
        coin,
        supabase,
        referrerSendAccount: hexToBytea(referrerSendAccount.address),
        vault,
      })

      await expect(async () => {
        await expect(supabase).toHaveEventInActivityFeed({
          event_name: 'referrals',
          from_user: {
            send_id: referrer.send_id,
            tags: referrerTags,
          },
          to_user: {
            id: profile.id,
            send_id: profile.send_id,
          },
          data: {},
        })
      }).toPass({
        timeout: 10_000,
        intervals: [1000, 2000, 3000, 5000],
      })
      await expect(async () => {
        await expect(supabase).toHaveEventInActivityFeed({
          event_name: Events.SendAccountTransfers,
          from_user: {
            send_id: profile.send_id,
          },
          to_user: null,
          data: {
            v: deposit.assets.toString(),
            f: hexToBytea(sendAccount.address as `0x${string}`),
            t: hexToBytea(sendEarnUsdcFactoryAddress[testBaseClient.chain.id]),
          },
        })
      }).toPass({
        timeout: 10_000,
        intervals: [1000, 2000, 3000, 5000],
      })
      await expect(async () => {
        await expect(supabase).toHaveEventInActivityFeed({
          event_name: Events.SendEarnDeposit,
          from_user: {
            send_id: profile.send_id,
          },
          to_user: null,
          data: {
            log_addr: hexToBytea(vault),
            owner: hexToBytea(sendAccount.address as `0x${string}`),
            assets: randomAmount.toString(),
          },
        })
      }).toPass({
        timeout: 10_000,
        intervals: [1000, 2000, 3000, 5000],
      })

      await verifyActivity({
        page: page.page,
        assets: BigInt(deposit.assets),
        coin,
        event: 'Deposit',
      })
      await verifyEarnings({
        page: page.page,
        coin,
        assets: BigInt(deposit.assets),
        event: 'Deposit',
      })
    })

    test(`can deposit ${coin.symbol} into SendEarn with an existing upline`, async ({
      earnDepositPage: page,
      sendAccount,
      supabase,
      user: { profile },
      referrer: { referrer, referrerTags, referrerSendAccount },
      pg,
    }) => {
      log = debug(`test:earn:deposit:referrer:${profile.id}:${test.info().parallelIndex}`)
      // using pg directly since using supabaseAdmin here is not working
      await pg.query(
        `
        INSERT INTO referrals (referrer_id, referred_id)
        VALUES ($1, $2)
      `,
        [referrer.id, profile.id]
      )

      // Generate a random deposit amount
      const randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
      const amountDecimals = formatUnits(randomAmount, coin.decimals)

      // Fund the account
      await fund({ address: sendAccount.address, amount: randomAmount + GAS_FEES, coin })

      // Navigate to the earn page with the referral code
      await page.navigate(coin)

      // Referral code should not be visible
      await checkReferralCodeHidden(page.page)

      // Complete the deposit
      const deposit = await page.deposit({
        coin,
        supabase,
        amount: amountDecimals,
      })

      // vault is the log_addr which should be the Send Earn address where the
      // fee recipient is the send earn affiliate
      const vault = checksumAddress(byteaToHex(deposit.log_addr))

      await verifyDeposit({
        owner: sendAccount.address,
        vault: vault,
        minDepositedAssets: MIN_DEPOSIT_AMOUNT,
        depositedAssets: randomAmount,
        deposit: deposit,
      })

      await verifyDepositAffiliateVault({
        coin,
        supabase,
        referrerSendAccount: hexToBytea(referrerSendAccount.address),
        vault,
      })
    })

    test(`can deposit again after withdrawing all funds for ${coin.symbol}`, async ({
      earnDepositPage,
      earnWithdrawPage,
      sendAccount,
      supabase,
      user: { profile }, // Added profile for logging
    }) => {
      test.setTimeout(60000) // Increase timeout as it involves multiple steps
      log = debug(`test:earn:deposit-after-withdraw:${profile.id}:${test.info().parallelIndex}`) // Updated log identifier

      // Generate random amount for initial deposit
      const initialDepositAmount = faker.number.bigInt({
        min: MIN_DEPOSIT_AMOUNT,
        max: MAX_DEPOSIT_AMOUNT,
      })
      const initialAmountDecimals = formatUnits(initialDepositAmount, coin.decimals)

      // Fund for initial deposit + gas
      await fund({ address: sendAccount.address, amount: initialDepositAmount + GAS_FEES, coin })
      log('Funded for initial deposit:', initialAmountDecimals, coin.symbol)

      // 1. Initial Deposit
      await earnDepositPage.navigate(coin)
      const deposit1 = await earnDepositPage.deposit({
        coin,
        supabase,
        amount: initialAmountDecimals,
      })
      const vault1 = checksumAddress(byteaToHex(deposit1.log_addr))
      log('Initial deposit completed into vault:', vault1)

      // Verify initial deposit went to the platform vault (assuming no referral for this test)
      expect(vault1).toBe(sendEarnAddress[testBaseClient.chain.id])

      // Need gas for withdrawal
      await fund({ address: sendAccount.address, amount: GAS_FEES, coin: usdcCoin }) // Assuming USDC for gas funding for simplicity, adjust if needed

      await earnWithdrawPage.goto(coin)
      await earnWithdrawPage.withdraw({
        coin,
        supabase,
        amount: initialAmountDecimals, // Withdraw the exact calculated amount
      })
      log('Full withdrawal completed')

      // Verify balance is near zero after withdrawal
      const remainingShares = await readSendEarnBalanceOf({
        vault: vault1,
        owner: sendAccount.address,
      })
      const remainingAssets = await readSendEarnConvertToAssets({
        vault: vault1,
        shares: remainingShares,
      })
      log('Remaining assets after withdrawal:', formatUnits(remainingAssets, coin.decimals))
      // Allow a small tolerance for potential dust amounts
      const tolerance = 1n * BigInt(10 ** (coin.decimals - 4)) // e.g., 0.0001 USDC
      expect(remainingAssets).toBeLessThanOrEqual(tolerance)

      // 3. Second Deposit
      const secondDepositAmount = faker.number.bigInt({
        min: MIN_DEPOSIT_AMOUNT,
        max: MAX_DEPOSIT_AMOUNT,
      })
      const secondAmountDecimals = formatUnits(secondDepositAmount, coin.decimals)

      // Fund for second deposit + gas
      await fund({ address: sendAccount.address, amount: secondDepositAmount + GAS_FEES, coin })
      log('Funded for second deposit:', secondAmountDecimals, coin.symbol)

      await earnDepositPage.goto(coin) // Navigate back to deposit page
      const deposit2 = await earnDepositPage.deposit({
        coin,
        supabase,
        amount: secondAmountDecimals,
      })
      const vault2 = checksumAddress(byteaToHex(deposit2.log_addr))
      log('Second deposit completed into vault:', vault2)

      // 4. Verification: Ensure the second deposit used the SAME vault
      expect(vault2).toBe(vault1)
      log('SUCCESS: Second deposit used the same vault as the first.')

      // Optional: Verify final balance
      const finalShares = await readSendEarnBalanceOf({
        vault: vault2, // or vault1, they should be the same
        owner: sendAccount.address,
      })
      const finalAssets = await readSendEarnConvertToAssets({
        vault: vault2,
        shares: finalShares,
      })
      log('Final assets after second deposit:', formatUnits(finalAssets, coin.decimals))
      // Final assets should be close to the second deposit amount
      expect(Number(formatUnits(finalAssets, coin.decimals))).toBeCloseTo(
        Number(secondAmountDecimals),
        2 // Allow some precision difference
      )
    })
  })

  test.describe(`Withdraw ${coin.symbol}`, () => {
    test.beforeEach(async ({ user: { profile }, earnDepositPage, sendAccount, supabase }) => {
      log = debug(`test:earn:withdraw:${profile.id}:${test.info().parallelIndex}`)

      // First deposit some funds to be able to withdraw
      const depositAmount = faker.number.bigInt({
        min: MIN_DEPOSIT_AMOUNT * BigInt(2),
        max: MAX_DEPOSIT_AMOUNT,
      })
      await fund({ address: sendAccount.address, amount: depositAmount + GAS_FEES, coin })

      // Deposit funds
      await earnDepositPage.navigate(coin)
      const amountDecimals = formatUnits(depositAmount, coin.decimals)
      await earnDepositPage.deposit({
        coin,
        supabase,
        amount: amountDecimals,
      })
    })

    test(`can withdraw ${coin.symbol} from SendEarn`, async ({
      earnWithdrawPage,
      sendAccount,
      supabase,
    }) => {
      // Calculate a withdrawal amount (half of the deposit)
      const balances = await readSendEarnBalanceOf({
        vault: sendEarnAddress[testBaseClient.chain.id],
        owner: sendAccount.address,
      })

      const assets = await readSendEarnConvertToAssets({
        vault: sendEarnAddress[testBaseClient.chain.id],
        shares: balances,
      })
      const withdrawAmount = faker.number.bigInt({ min: 1n, max: assets })

      await withdraw({
        earnWithdrawPage,
        sendAccount,
        supabase,
        amount: withdrawAmount,
        startAssets: assets,
      })
    })

    test(`can withdraw all ${coin.symbol} deposited amount from SendEarn`, async ({
      earnWithdrawPage,
      sendAccount,
      supabase,
    }) => {
      // Calculate a withdrawal amount (half of the deposit)
      const balances = await readSendEarnBalanceOf({
        vault: sendEarnAddress[testBaseClient.chain.id],
        owner: sendAccount.address,
      })

      const assets = await readSendEarnConvertToAssets({
        vault: sendEarnAddress[testBaseClient.chain.id],
        shares: balances,
      })

      // Withdraw all deposited amount
      await withdraw({
        earnWithdrawPage,
        sendAccount,
        supabase,
        amount: assets,
        startAssets: assets,
      })
    })

    async function withdraw({
      earnWithdrawPage,
      sendAccount,
      supabase,
      amount,
      startAssets,
    }: {
      earnWithdrawPage: EarnWithdrawPage
      sendAccount: Tables<'send_accounts'>
      supabase: SupabaseClient<Database>
      amount: bigint
      startAssets: bigint
    }) {
      // Navigate to withdraw page
      await earnWithdrawPage.goto(coin)

      // Withdraw random deposited amount
      const withdrawAmount = amount
      const withdrawAmountDecimals = formatUnits(withdrawAmount, coin.decimals)

      log('withdrawing', withdrawAmountDecimals, coin.symbol)

      // Complete the withdrawal
      const withdrawal = await earnWithdrawPage.withdraw({
        coin,
        supabase,
        amount: withdrawAmountDecimals,
      })

      // Verify the withdrawal
      expect(withdrawal).toBeDefined()
      expect(withdrawal.owner).toBeDefined()
      expect(withdrawal.shares).toBeDefined()
      expect(BigInt(withdrawal.shares)).toBeGreaterThan(BigInt(0))
      expect(withdrawal.assets).toBeDefined()
      expect(BigInt(withdrawal.assets)).toBeGreaterThan(BigInt(0))

      // Verify the remaining balance
      const remainingShares = await readSendEarnBalanceOf({
        vault: sendEarnAddress[testBaseClient.chain.id],
        owner: sendAccount.address,
      })

      const remainingAssets = await readSendEarnConvertToAssets({
        vault: sendEarnAddress[testBaseClient.chain.id],
        shares: remainingShares,
      })

      // The remaining assets should be approximately half of the original deposit
      // We allow for some small difference due to rounding and fees
      const tolerance = BigInt(10 ** (coin.decimals - 2)) // 0.01 in the coin's smallest unit
      expect(remainingAssets).toBeLessThanOrEqual(startAssets - withdrawAmount + tolerance)
      expect(remainingAssets).toBeGreaterThanOrEqual(startAssets - withdrawAmount - tolerance)

      await verifyActivity({
        page: earnWithdrawPage.page,
        assets: BigInt(withdrawAmount),
        coin,
        event: 'Withdraw',
      })
      await verifyEarnings({
        page: earnWithdrawPage.page,
        coin,
        assets: BigInt(withdrawAmount),
        event: 'Withdraw',
      })
    }
  })

  test.describe(`Affiliate Rewards for ${coin.symbol}`, () => {
    test.beforeEach(async ({ user: { profile }, earnDepositPage, sendAccount, supabase }) => {
      log = debug(`test:earn:affiliate:${profile.id}:${test.info().parallelIndex}`)
    })

    test(`can claim affiliate rewards for ${coin.symbol}`, async ({
      earnDepositPage,
      earnClaimPage,
      supabase,
      user: { profile },
      sendAccount,
    }) => {
      test.setTimeout(40_000)
      log = debug(`test:earn:claim:${profile.id}:${test.info().parallelIndex}`)

      // 1. Set up: Mock transfer some rewards on behalf of the affiliate
      // There is a minimum claim amount of ¢.05 USDC
      const amount = faker.number.bigInt({
        min: MIN_DEPOSIT_AMOUNT * BigInt(10),
        max: MAX_DEPOSIT_AMOUNT,
      })
      const dealer = privateKeyToAccount(generatePrivateKey())

      const claimReady = (async () => {
        // Fund the dealer
        await Promise.all([
          fund({
            address: dealer.address,
            amount: parseEther('1'),
            coin: ethCoin,
          }),
          fund({ address: dealer.address, amount, coin }),
        ])

        // create SendEarn Affiliate
        await createSendEarn({
          account: dealer,
          affiliate: sendAccount.address,
          coin,
        })

        // Get the affiliate vault address
        const affiliateVault = await withRetry(
          async () => {
            const { data: affiliateData, error } = await supabase
              .from('send_earn_new_affiliate')
              .select(
                'affiliate, send_earn_affiliate, send_earn_affiliate_vault(send_earn, log_addr)'
              )
              .eq('affiliate', hexToBytea(sendAccount.address))
              .not('send_earn_affiliate_vault', 'is', null)
              .single()

            throwIf(error)

            expect(affiliateData).toBeDefined()
            assert(!!affiliateData, 'Affiliate data is not defined')
            const affiliateVault = AffiliateVaultSchema.parse(affiliateData)
            assert(!!affiliateVault, 'Affiliate vault is not defined')
            return affiliateVault
          },
          {
            retryCount: 50,
            delay: 500,
          }
        )

        assert(!!affiliateVault.send_earn_affiliate_vault, 'Affiliate vault is not defined')

        // Get the vault address from the affiliate data
        // The send_earn field is in bytea format, we need to convert it to hex string format
        // and then checksum it for use with the blockchain
        const vaultHex = affiliateVault.send_earn_affiliate_vault.send_earn
        // Checksum the address for use with the blockchain
        const referrerVault = checksumAddress(vaultHex)

        // Deposit on behalf of the referrer
        await depositOnBehalfOf({
          asset: coin.token,
          account: dealer,
          receiver: affiliateVault.send_earn_affiliate,
          amount,
          vault: referrerVault,
        })

        return { affiliateVault }
      })()

      // It's a prerequisite that the affiliate has a Send Earn deposit to claim rewards through the app
      await earnDepositPage.navigate(coin)
      await earnDepositPage.deposit({
        coin,
        supabase,
        amount: formatUnits(MIN_DEPOSIT_AMOUNT, coin.decimals),
      })

      const { affiliateVault } = await claimReady
      assert(!!affiliateVault.send_earn_affiliate_vault, 'Affiliate vault is not defined')

      // Calculate expected reward
      const split = await readSendEarnSplit(coin)
      const rewardShare = mulDivDown(amount, WAD - split, WAD)

      // 2. Navigate to the claim page
      await earnClaimPage.goto(coin)

      // 3. Check available rewards
      let availableRewards: number | undefined
      await expect
        .poll(
          async () => {
            availableRewards = await earnClaimPage.getAvailableRewards()
            return availableRewards > 0
          },
          {
            timeout: 10_000,
            intervals: [1000, 2000, 3000, 5000],
            message: 'Expected to find available rewards',
          }
        )
        .toBe(true)
      assert(!!availableRewards, 'Available rewards is not defined')
      expect(availableRewards).toBeCloseTo(Number(formatUnits(rewardShare, coin.decimals)), 2)

      // Ensure Send Earn Revenue Safe gets split
      const revenueSafeBalance = await readSendEarnBalanceOf({
        vault: sendEarnAddress[testBaseClient.chain.id],
        owner: '0x65049c4b8e970f5bccdae8e141aa06346833cec4',
      })

      // 4. Claim rewards
      const claimTx = await earnClaimPage.claimRewards({
        affiliateVault,
        supabase,
      })

      // 5. Verify claim transaction
      expect(claimTx).toBeDefined()
      expect(Number(formatUnits(BigInt(claimTx.assets), coin.decimals))).toBeCloseTo(
        availableRewards,
        2
      )

      await verifyActivity({
        page: earnClaimPage.page,
        assets: BigInt(claimTx.assets),
        coin,
        event: 'Rewards',
      })
      await verifyEarnings({
        page: earnClaimPage.page,
        coin,
        assets: BigInt(claimTx.assets),
        event: 'Rewards',
      })

      // all we really can do is check that the balance increased
      expect(
        await readSendEarnBalanceOf({
          vault: sendEarnAddress[testBaseClient.chain.id],
          owner: '0x65049c4b8e970f5bccdae8e141aa06346833cec4',
        })
      ).toBeGreaterThan(revenueSafeBalance)
    })
  })

  test.describe(`Self-Referral Prevention for ${coin.symbol}`, () => {
    test(`cannot use own referral code for ${coin.symbol}`, async ({
      earnDepositPage: page,
      sendAccount,
      supabase,
      user: { profile },
    }) => {
      log = debug(`test:earn:self-referral:${profile.id}:${test.info().parallelIndex}`)

      // 1. Get the user's own referral code
      const { data: referralData } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', profile.id)
        .single()

      const selfReferralCode = referralData?.referral_code
      expect(selfReferralCode).toBeDefined()

      // 2. Try to navigate to the earn page with own referral code
      await page.page.goto(`/?referral=${selfReferralCode}`)
      await page.page.waitForURL(`/?referral=${selfReferralCode}`)

      // 3. Check that the referral code is not applied or shows an error
      // The system might either show an error or silently ignore the self-referral
      try {
        // If there's an explicit error message
        await expect(page.page.getByText('Invalid referral code')).toBeVisible({
          timeout: 5000,
        })
      } catch (e) {
        // If there's no explicit error, the referral code should not be applied
        await checkReferralCodeHidden(page.page)
      }

      // 4. Try to deposit with the self-referral
      const randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
      const amountDecimals = formatUnits(randomAmount, coin.decimals)

      // Fund the account
      await fund({ address: sendAccount.address, amount: randomAmount + GAS_FEES, coin })

      await page.navigate(coin)

      // 5. Complete the deposit
      const deposit = await page.deposit({
        coin,
        supabase,
        amount: amountDecimals,
      })

      // 6. Verify the deposit went to the default vault, not an affiliate vault
      const vault = checksumAddress(byteaToHex(deposit.log_addr))
      expect(vault).toBe(sendEarnAddress[testBaseClient.chain.id])

      // 7. Verify no self-referral relationship was created
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', profile.id)
        .eq('referred_id', profile.id)

      expect(referrals).toHaveLength(0)
    })
  })

  test.describe(`Vault Consistency for ${coin.symbol}`, () => {
    test(`always deposits into the same vault for ${coin.symbol}`, async ({
      earnDepositPage: page,
      sendAccount,
      supabase,
    }) => {
      test.setTimeout(40000)
      log = debug(`test:earn:vault-consistency:${test.info().parallelIndex}`)

      // Generate random amounts for deposits
      const randomAmount1 = faker.number.bigInt({
        min: MIN_DEPOSIT_AMOUNT,
        max: MAX_DEPOSIT_AMOUNT,
      })
      const randomAmount2 = randomAmount1 / BigInt(2)
      const randomAmount3 = randomAmount1 / BigInt(3)

      // Fund the account with enough for all deposits plus gas
      const totalAmount = randomAmount1 + randomAmount2 + randomAmount3 + GAS_FEES * BigInt(3)
      await fund({ address: sendAccount.address, amount: totalAmount, coin })

      // 1. Make an initial deposit
      const amount1 = formatUnits(randomAmount1, coin.decimals)
      await page.navigate(coin)
      const deposit1 = await page.deposit({
        coin,
        supabase,
        amount: amount1,
      })

      const vault1 = checksumAddress(byteaToHex(deposit1.log_addr))

      // Verify the first deposit
      await verifyDeposit({
        owner: sendAccount.address,
        vault: vault1,
        minDepositedAssets: MIN_DEPOSIT_AMOUNT,
        depositedAssets: randomAmount1,
        deposit: deposit1,
      })

      // 2. Make a second deposit with different parameters
      // Wait some time or perform other actions in between
      await page.page.waitForTimeout(2000)

      // Use a different amount
      const amount2 = formatUnits(randomAmount2, coin.decimals)
      await page.goto(coin)
      const deposit2 = await page.deposit({
        coin,
        supabase,
        amount: amount2,
      })

      const vault2 = checksumAddress(byteaToHex(deposit2.log_addr))

      // 3. Verify both deposits went to the same vault
      expect(vault2).toBe(vault1)

      // 4. Make a third deposit after some user activity
      // Navigate away and back
      await page.page.goto('/')
      await page.goto(coin)

      const amount3 = formatUnits(randomAmount3, coin.decimals)
      const deposit3 = await page.deposit({
        coin,
        supabase,
        amount: amount3,
      })

      const vault3 = checksumAddress(byteaToHex(deposit3.log_addr))

      // 5. Verify all deposits went to the same vault
      expect(vault3).toBe(vault1)

      // 6. Query the database to verify all deposits for this user and asset
      // are associated with the same vault
      const { data: balance, error } = await supabase
        .from('send_earn_balances')
        .select('log_addr, assets::text')
        .limit(10)

      expect(error).toBeFalsy()

      expect(balance).toBeDefined()
      assert(!!balance, 'No deposits found')

      // All deposits should have the same log_addr
      const uniqueVaults = new Set(balance.map((d) => checksumAddress(byteaToHex(d.log_addr))))
      expect(uniqueVaults.size).toBe(1)
      expect(uniqueVaults.has(vault1)).toBeTruthy()

      // Assets should total up to the amount deposited
      const totalAssets = balance.reduce((acc, deposit) => {
        return acc + Number(formatUnits(BigInt(deposit.assets), coin.decimals))
      }, 0)
      const totalDeposited = [amount1, amount2, amount3].reduce((acc, a) => acc + Number(a), 0)
      expect(totalAssets).toBeCloseTo(totalDeposited, 2)
    })
  })
}
async function verifyActivity({
  page,
  assets,
  coin,
  event,
}: {
  page: Page
  assets: bigint
  coin: erc20Coin
  event: string
}) {
  await page.goto('/activity')
  await expect(
    page.getByText(
      `${event} ${formatAmount(
        formatUnits(BigInt(assets), coin.decimals),
        5,
        coin.formatDecimals
      )} ${coin.symbol}`
    )
  ).toBeVisible()
}

async function verifyEarnings({
  page,
  coin,
  assets,
  event,
}: {
  page: Page
  coin: erc20Coin
  assets: bigint
  event: string
}) {
  await page.goto(`/earn/${coinToParam(coin)}/balance`)
  await expect(
    page.getByText(
      `${event} ${formatAmount(
        formatUnits(BigInt(assets), coin.decimals),
        5,
        coin.formatDecimals
      )} ${coin.symbol}`
    )
  ).toBeVisible()
}
async function verifyDepositAffiliateVault({
  coin,
  supabase,
  referrerSendAccount,
  vault,
}: {
  coin: erc20Coin
  supabase: SupabaseClient<Database>
  referrerSendAccount: PgBytea
  vault: `0x${string}`
}) {
  const factory = assetsToEarnFactory[coin.token]
  assert(!!factory, 'Asset is not supported')

  // Verify the deposit was into the referrer affiliate vault
  const { data, error } = await supabase
    .from('send_earn_new_affiliate')
    .select('affiliate, send_earn_affiliate, send_earn_affiliate_vault(send_earn, log_addr)')
    .eq('affiliate', referrerSendAccount)
    .eq('log_addr', hexToBytea(factory)) // each asset has its own factory
    .not('send_earn_affiliate_vault', 'is', null)
    .single()
  expect(error).toBeFalsy()
  assert(!!data, 'No affiliate vault found')
  const affiliateVault = AffiliateVaultSchema.parse(data)
  assert(!!affiliateVault, 'Affiliate vault is not defined')
  expect(affiliateVault.send_earn_affiliate_vault).toBeDefined()
  expect(affiliateVault.send_earn_affiliate_vault?.send_earn).toBe(vault)
}
