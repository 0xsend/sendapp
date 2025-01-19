import { expect, test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { mergeTests } from '@playwright/test'
import { sendCoin, sendV0Coin } from 'app/data/coins'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import debug from 'debug'
import { parseUnits } from 'viem'
import { lookupBalance, testBaseClient } from './fixtures/viem'

const test = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

test.beforeEach(async ({ user: { profile }, supabase }) => {
  log = debug(`test:send:${profile.id}:${test.info().parallelIndex}`)
})

test('can upgrade their Send Token V0 to Send Token V1', async ({ page, sendAccount }) => {
  const balance = 100_000_000n

  // set a Send Token V0 balance
  await setERC20Balance({
    client: testBaseClient,
    address: sendAccount.address as `0x${string}`,
    tokenAddress: sendV0Coin.token,
    value: BigInt(balance),
  })

  await page.goto('/')

  // should see the Upgrade screen
  await expect(page.getByRole('heading', { name: 'TOKEN UPGRADE' })).toBeVisible()

  // let's upgrade
  const upgradeButton = page.getByRole('button', { name: 'UPGRADE' })
  await expect(upgradeButton).toBeVisible()
  await upgradeButton.click()

  // wait until the upgrade is complete
  await expect(async () => {
    await page
      .getByRole('button', { name: 'UPGRADING...' })
      .waitFor({ state: 'detached', timeout: 2_000 })

    // send token v0 balance should be 0
    const sendTokenV0Balance = await lookupBalance({
      address: sendAccount.address as `0x${string}`,
      token: sendV0Coin.token,
    })
    expect(sendTokenV0Balance).toEqual(0n)
  }).toPass({
    timeout: 10_000,
  })

  // should see the Send Token V1 balance
  const sendTokenV1Balance = await lookupBalance({
    address: sendAccount.address as `0x${string}`,
    token: sendCoin.token,
  })
  expect(sendTokenV1Balance).toEqual(parseUnits((balance / 100n).toString(), sendCoin.decimals))

  // should see send token upgrade activity
  await page.goto('/activity')
  await expect(async () => {
    const sendTokenUpgradeActivity = page.getByText('Send Token Upgrade')
    await expect(sendTokenUpgradeActivity).toBeVisible()
  }).toPass({
    timeout: 10_000,
  })
})
