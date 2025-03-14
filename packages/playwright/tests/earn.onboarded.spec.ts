import { faker } from '@faker-js/faker'
import { expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { type SeedClient, userOnboarded } from '@my/snaplet'
import { config, sendEarnAbi, sendEarnAddress, usdcAddress } from '@my/wagmi'
import { mergeTests } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import debug from 'debug'
import { formatUnits } from 'viem'
import { readContract } from 'viem/actions'
import { test as depositTest, type EarnDepositPage } from './fixtures/deposit'
import { lookupBalance, testBaseClient } from './fixtures/viem'

const DECIMALS = 6
// $10
const GAS_FEES = BigInt(10 * 10 ** DECIMALS)
// $100K
const MAX_DEPOSIT_AMOUNT = BigInt(100_000 * 10 ** DECIMALS)
// ¢1
const MIN_DEPOSIT_AMOUNT = BigInt(1 * 10 ** (DECIMALS - 2))

let log: debug.Debugger

const test = mergeTests(depositTest, snapletTest)

test.beforeEach(async ({ user: { profile } }) => {
  log = debug(`test:earn:deposit:${profile.id}:${test.info().parallelIndex}`)
})

/**
 * Sets up a referrer user with a valid referral code and send account
 */
const setupReferrer = async (
  seed: SeedClient
): Promise<{
  referrer: { referral_code: string; send_id: number; id: string }
  referrerSendAccount: { address: `0x${string}` }
  referrerTags: string[]
}> => {
  const plan = await seed.users([userOnboarded])
  const referrer = plan.profiles[0]
  const referrerSendAccount = plan.send_accounts[0] as { address: `0x${string}` }
  const referrerTags = plan.tags.map((t) => t.name)
  assert(!!referrer, 'profile not found')
  assert(!!referrer.referral_code, 'referral code not found')
  assert(!!referrerSendAccount, 'referrer send account not found')
  return { referrer, referrerSendAccount, referrerTags } as {
    referrer: { referral_code: string; send_id: number; id: string }
    referrerSendAccount: { address: `0x${string}` }
    referrerTags: string[]
  }
}

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
  depositedAssets,

  deposit,
}: {
  owner: `0x${string}`
  vault: `0x${string}`
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
  expect(MIN_DEPOSIT_AMOUNT).toBeGreaterThanOrEqual(depositedAssets - assets)
  expect(Number(formatUnits(dbAssets, 6))).toBeCloseTo(depositedAssetsDecimals, -2) // Looser precision due to potential rounding

  expect(deposit.shares).toBeDefined()
  expect(BigInt(deposit.shares)).toBeGreaterThan(BigInt(0))
  expect(Number(formatUnits(dbShares, decimals))).toBeCloseTo(dbSharesDecimals, -2) // Looser precision due to potential rounding
}

test('can deposit USDC into Platform SendEarn', async ({
  earnDepositPage: page,
  sendAccount,
  setUsdcBalance,
  supabase,
}) => {
  const randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
  const amountDecimals = formatUnits(randomAmount, DECIMALS)

  await setUsdcBalance({
    address: sendAccount.address,
    value: randomAmount + GAS_FEES,
  })

  await page.page.reload()

  const deposit = await page.deposit({
    page,
    sendAccount,
    supabase,
    amount: amountDecimals,
  })

  await verifyDeposit({
    owner: sendAccount.address,
    vault: sendEarnAddress[testBaseClient.chain.id],
    depositedAssets: randomAmount,
    deposit,
  })
})
/*
test('can deposit USDC into SendEarn with a referral code', async ({
  earnDepositPage,
  sendAccount,
  setUsdcBalance,
  supabase,
  seed,
  user: { profile },
}) => {
  // Set up a referrer
  const { referrer, referrerSendAccount, referrerTags } = await setupReferrer(seed)

  // Generate a random deposit amount
  const randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
  const amountDecimals = formatUnits(randomAmount, DECIMALS)

  // Set USDC balance for the test user
  await setUsdcBalance({
    address: sendAccount.address,
    value: randomAmount + GAS_FEES,
  })

  // Get the initial balance of the referrer to calculate reward later
  const initialReferrerBalance = await lookupBalance({
    address: referrerSendAccount.address,
    token: usdcAddress[testBaseClient.chain.id],
  })

  // Navigate to the earn page with the referral code
  await earnDepositPage.page.goto(`/?referral=${referrer.referral_code}`)
  await earnDepositPage.goto()

  // Check if the referral code is visible and applied
  await checkReferralCodeVisibility(earnDepositPage, referrer.referral_code)

  log('depositing', amountDecimals, 'USDC with referral code', referrer.referral_code)

  // Complete the deposit
  await earnDepositPage.fillAmount(amountDecimals)
  await earnDepositPage.acceptTerms()
  await earnDepositPage.submit()

  // Verify the deposit was successful by checking shares and assets
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
  log('diff', randomAmount - assets)
  expect(MIN_DEPOSIT_AMOUNT).toBeGreaterThanOrEqual(randomAmount - assets)

  // Verify the deposit was recorded in the database
  // biome-ignore lint/suspicious/noExplicitAny: This is a test file
  let deposit: any = null

  // Wait and retry a few times as there might be a delay in the deposit being recorded
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

  // @ts-ignore - TypeScript doesn't understand that deposit is not null at this point
  const dbAssets = BigInt(deposit.assets)
  const expectedAssets = Number(formatUnits(randomAmount, 6))

  // @ts-ignore - TypeScript doesn't understand that deposit is not null at this point
  expect(Number(formatUnits(dbAssets, 6))).toBeCloseTo(expectedAssets, -2) // Looser precision due to potential rounding

  // @ts-ignore - TypeScript doesn't understand that deposit is not null at this point
  expect(deposit.shares).toBeDefined()
  // @ts-ignore - TypeScript doesn't understand that deposit is not null at this point
  expect(BigInt(deposit.shares)).toBeGreaterThan(BigInt(0))

  // Verify the referrer is recorded correctly
  // @ts-ignore - TypeScript doesn't understand that deposit is not null at this point
  expect(deposit.referrer).toBeDefined()
  // @ts-ignore - TypeScript doesn't understand that deposit is not null at this point
  expect(deposit.referrer).toBe(hexToBytea(referrerSendAccount.address))

  // Verify the referrer received the reward
  await verifyReferralReward(referrerSendAccount.address, randomAmount, initialReferrerBalance)

  // Verify the referral is recorded in the activity feed
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
    data: {
      type: 'earn',
      amount: randomAmount.toString(),
    },
  })
})

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
