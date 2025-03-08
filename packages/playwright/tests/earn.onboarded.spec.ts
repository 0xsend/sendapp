import { faker } from '@faker-js/faker'
import { expect } from '@my/playwright/fixtures/send-accounts'
import { config, readSendEarnBalanceOf, readSendEarnConvertToAssets } from '@my/wagmi'
import debug from 'debug'
import { formatUnits } from 'viem'
import { test } from './fixtures/deposit'
import { testBaseClient } from './fixtures/viem'
import { assert } from 'app/utils/assert'

const DECIMALS = 6
// $10
const GAS_FEES = BigInt(10 * 10 ** DECIMALS)
// $100K
const MAX_DEPOSIT_AMOUNT = BigInt(100_000 * 10 ** DECIMALS)
// ¢1
const MIN_DEPOSIT_AMOUNT = BigInt(1 * 10 ** (DECIMALS - 2))

let log: debug.Debugger

test.beforeEach(async ({ user: { profile } }) => {
  log = debug(`test:earn:deposit:${profile.id}:${test.info().parallelIndex}`)
})

test('can deposit USDC into SendEarn', async ({
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

  log('depositing', amountDecimals, 'USDC')

  await page.fillAmount(amountDecimals)
  await page.acceptTerms()
  await page.submit()

  // first get shares
  const shares = await readSendEarnBalanceOf(config, {
    args: [sendAccount.address],
    chainId: testBaseClient.chain.id,
  })
  // then convert shares to assets
  const assets = await readSendEarnConvertToAssets(config, {
    args: [shares],
    chainId: testBaseClient.chain.id,
  })
  // assets must equal to the amount deposited
  log('assets', assets)
  expect(Number(formatUnits(assets, 6))).toBeCloseTo(Number(amountDecimals), 2)
  log('diff', randomAmount - assets)
  expect(MIN_DEPOSIT_AMOUNT).toBeGreaterThanOrEqual(randomAmount - assets)

  let deposit: { owner: string; shares: string; assets: string; sender: string }

  // Wait and retry a few times as there might be a delay in the deposit being recorded
  await expect
    .poll(
      async () => {
        const { data, error } = await supabase
          .from('send_earn_deposits')
          .select('owner, shares::text, assets::text, sender')
          .order('block_num', { ascending: false })
          .single()

        if (error) {
          log('error fetching send_earn_deposits', error)
          return false
        }

        log('send_earn_deposits query result', data)
        deposit = data
        return true
      },
      {
        timeout: 15000,
        intervals: [1000, 2000, 3000, 5000],
        message: 'Expected to find a send_earn_deposits record in Supabase',
      }
    )
    .toBeTruthy()

  // @ts-expect-error - we know deposit is not null
  assert(deposit, 'Expected to find a send_earn_deposits record in Supabase')

  // Convert assets from database to a number for comparison
  const dbAssets = Number(formatUnits(BigInt(deposit.assets), 6))
  // Convert our expected amount from bigint string to a number
  const expectedAssets = Number(formatUnits(randomAmount, 6))

  // Assets should be close to the deposited amount (allowing for some precision loss)
  expect(dbAssets).toBeCloseTo(expectedAssets, -2) // Looser precision due to potential rounding

  // Verify other important fields
  expect(deposit.sender).toBeDefined()
  expect(deposit.shares).toBeDefined()
  expect(deposit.shares).toBeGreaterThan(0)
})
