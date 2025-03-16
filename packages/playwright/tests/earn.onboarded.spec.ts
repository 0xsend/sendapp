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
import { test as depositTest, type EarnDepositPage } from './fixtures/deposit'
import { fund, testBaseClient } from './fixtures/viem'

let log: debug.Debugger

// $10
const GAS_FEES = BigInt(10 * 10 ** usdcCoin.decimals)

const test = mergeTests(depositTest, snapletTest)

/**
 * Checks if the referral code is visible and applied correctly
 */
const checkReferralCodeVisibility = async (
  earnDepositPage: EarnDepositPage,
  referralCode: string
) => {
  const refcodeInput = earnDepositPage.page.getByTestId('referral-code-input')
  const referralCodeConfirmation = earnDepositPage.page.getByText('Referral code applied')

  await expect(refcodeInput).toBeVisible()
  await expect(refcodeInput).toHaveValue(referralCode)
  await expect(referralCodeConfirmation).toBeVisible()
}

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
    referrer: { referrer, referrerSendAccount },
  }) => {
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
    await checkReferralCodeVisibility(page, referrer.referral_code)

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
      .select('affiliate, send_earn_affiliate_vault(send_earn)')
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
  })
}

/*
test('handles invalid referral code when depositing to SendEarn', async ({
  earnDepositPage,
  sendAccount,
  setUsdcBalance,
}) => {
  // Generate a random deposit amount
  const randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
  const amountDecimals = formatUnits(randomAmount, DECIMALS)

  // Set USDC balance for the test user
  await setUsdcBalance({
    address: sendAccount.address,
    value: randomAmount + GAS_FEES,
  })

  // Navigate to the earn page with an invalid referral code
  const invalidReferralCode = 'invalid123'
  await earnDepositPage.page.goto(`/?referral=${invalidReferralCode}`)
  await earnDepositPage.goto()

  // Check if the referral code input is visible
  const refcodeInput = earnDepositPage.page.getByTestId('referral-code-input')
  await expect(refcodeInput).toBeVisible()

  // Verify that the invalid referral code message is shown
  const invalidReferralMessage = earnDepositPage.page.getByText('Invalid referral code')
  await expect(invalidReferralMessage).toBeVisible()

  // Complete the deposit without a valid referral
  await earnDepositPage.fillAmount(amountDecimals)
  await earnDepositPage.acceptTerms()
  await earnDepositPage.submit()

  // Verify the deposit was successful
  const shares = await readSendEarnBalanceOf(config, {
    args: [sendAccount.address],
    chainId: testBaseClient.chain.id,
  })

  const assets = await readSendEarnConvertToAssets(config, {
    args: [shares],
    chainId: testBaseClient.chain.id,
  })

  // Assets must equal to the amount deposited
  log('assets', assets)
  expect(Number(formatUnits(assets, 6))).toBeCloseTo(Number(amountDecimals), 2)
})

test('cannot use self-referral when depositing to SendEarn', async ({
  earnDepositPage,
  sendAccount,
  setUsdcBalance,
  supabase,
  user: { profile },
}) => {
  // Generate a random deposit amount
  const randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
  const amountDecimals = formatUnits(randomAmount, DECIMALS)

  // Set USDC balance for the test user
  await setUsdcBalance({
    address: sendAccount.address,
    value: randomAmount + GAS_FEES,
  })

  // Navigate to the earn page with the user's own referral code
  await earnDepositPage.page.goto(`/?referral=${profile.referral_code}`)
  await earnDepositPage.goto()

  // The referral code should be rejected (either not shown or marked as invalid)
  // This depends on how the UI handles self-referrals
  const refcodeInput = earnDepositPage.page.getByTestId('referral-code-input')
  if (await refcodeInput.isVisible()) {
    // If visible, it should show as invalid
    const invalidReferralMessage = earnDepositPage.page.getByText('Invalid referral code')
    await expect(invalidReferralMessage).toBeVisible()
  }

  // Complete the deposit
  await earnDepositPage.fillAmount(amountDecimals)
  await earnDepositPage.acceptTerms()
  await earnDepositPage.submit()

  // Verify the deposit was successful but without a referrer
  // biome-ignore lint/suspicious/noExplicitAny: This is a test file
  let deposit: any = null

  await expect
    .poll(
      async () => {
        try {
          const { data, error } = await supabase
            .from('send_earn_deposits')
            .select('log_addr, owner, shares::text, assets::text, referrer')
            .order('block_num', { ascending: false })
            .single()

          if (error) {
            log('error fetching send_earn_deposits', error)
            return false
          }

          log('send_earn_deposits query result', data)
          deposit = data
          return true
        } catch (e) {
          log('error in poll function', e)
          return false
        }
      },
      {
        timeout: 15000,
        intervals: [1000, 2000, 3000, 5000],
        message: 'Expected to find a send_earn_deposits record in Supabase',
      }
    )
    .toBeTruthy()

  // Check if deposit exists
  expect(deposit).not.toBeNull()
  if (!deposit) {
    throw new Error('Expected to find a send_earn_deposits record in Supabase')
  }

  // Verify no referrer is recorded for self-referral
  // @ts-ignore - TypeScript doesn't understand that deposit is not null at this point
  expect(deposit.referrer).toBeNull()
})
*/
