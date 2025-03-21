import { faker } from '@faker-js/faker'
import { expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { sendEarnAbi, sendEarnAddress } from '@my/wagmi'
import { mergeTests } from '@playwright/test'
import { usdcCoin } from 'app/data/coins'
import { AffiliateVaultSchema } from 'app/features/earn/zod'
import { assert } from 'app/utils/assert'
import { byteaToHex } from 'app/utils/byteaToHex'
import { hexToBytea } from 'app/utils/hexToBytea'
import { assetsToEarnFactory } from 'app/utils/sendEarn'
import debug from 'debug'
import { checksumAddress, formatUnits } from 'viem'
import { readContract } from 'viem/actions'
import { test as earnTest } from './fixtures/earn'
import { checkReferralCodeVisibility } from './fixtures/referrals'
import { fund, testBaseClient } from './fixtures/viem'

let log: debug.Debugger

// $10
const GAS_FEES = BigInt(10 * 10 ** usdcCoin.decimals)

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

for (const coin of [usdcCoin]) {
  // $100K
  const MAX_DEPOSIT_AMOUNT = BigInt(100_000 * 10 ** coin.decimals)
  // ¢1
  const MIN_DEPOSIT_AMOUNT = BigInt(1 * 10 ** (coin.decimals - 2))
  let randomAmount: bigint

  test.describe(`Deposit ${coin.symbol}`, () => {
    test.beforeEach(async ({ user: { profile }, earnDepositPage: page, sendAccount }) => {
      log = debug(`test:earn:deposit:${profile.id}:${test.info().parallelIndex}`)
      randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
      await fund({ address: sendAccount.address, amount: randomAmount + GAS_FEES, coin })
      await page.goto(coin)
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
      await page.goto(coin)

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

      const factory = assetsToEarnFactory[coin.token]
      assert(!!factory, 'Asset is not supported')

      // Verify the deposit was into the referrer affiliate vault
      const { data, error } = await supabase
        .from('send_earn_new_affiliate')
        .select('affiliate, send_earn_affiliate, send_earn_affiliate_vault(send_earn, log_addr)')
        .eq('affiliate', hexToBytea(referrerSendAccount.address))
        .eq('log_addr', hexToBytea(factory)) // each asset has its own factory
        .not('send_earn_affiliate_vault', 'is', null)
        .single()
      expect(error).toBeFalsy()
      assert(!!data, 'No affiliate vault found')
      const affiliateVault = AffiliateVaultSchema.parse(data)
      assert(!!affiliateVault, 'Affiliate vault is not defined')
      expect(affiliateVault.send_earn_affiliate_vault).toBeDefined()
      expect(affiliateVault.send_earn_affiliate_vault?.send_earn).toBe(vault)

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
      await earnDepositPage.goto(coin)
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
      // Navigate to withdraw page
      await earnWithdrawPage.goto(coin)

      // Calculate a withdrawal amount (half of the deposit)
      const balances = await readSendEarnBalanceOf({
        vault: sendEarnAddress[testBaseClient.chain.id],
        owner: sendAccount.address,
      })

      const assets = await readSendEarnConvertToAssets({
        vault: sendEarnAddress[testBaseClient.chain.id],
        shares: balances,
      })

      // Withdraw half of the deposited amount
      const withdrawAmount = assets / BigInt(2)
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
      expect(remainingAssets).toBeLessThanOrEqual(assets - withdrawAmount + tolerance)
      expect(remainingAssets).toBeGreaterThanOrEqual(assets - withdrawAmount - tolerance)
    })
  })
}
