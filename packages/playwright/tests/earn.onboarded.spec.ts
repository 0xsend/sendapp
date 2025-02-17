import { faker } from '@faker-js/faker'
import { expect } from '@my/playwright/fixtures/send-accounts'
import { config, readSendEarnBalanceOf, readSendEarnConvertToAssets } from '@my/wagmi'
import debug from 'debug'
import { formatUnits } from 'viem'
import { test } from './fixtures/deposit'
import { testBaseClient } from './fixtures/viem'

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
}) => {
  const randomAmount = faker.number.bigInt({ min: MIN_DEPOSIT_AMOUNT, max: MAX_DEPOSIT_AMOUNT })
  const amountDecimals = formatUnits(randomAmount, 6)

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
})
