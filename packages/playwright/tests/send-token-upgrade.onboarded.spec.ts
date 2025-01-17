import { expect, test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { userOnboarded } from '@my/snaplet/models'
import type { Database } from '@my/supabase/database.types'
import { mergeTests, type Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { coins, sendCoin, sendV0Coin, type coin } from 'app/data/coins'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { shorten } from 'app/utils/strings'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import debug from 'debug'
import { isAddress, parseUnits } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { ProfilePage } from './fixtures/profiles'
import { SendPage } from './fixtures/send'
import { lookupBalance, testBaseClient } from './fixtures/viem'

const test = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

test.beforeEach(async ({ user: { profile }, supabase }) => {
  log = debug(`test:send:${profile.id}:${test.info().parallelIndex}`)
})

test('can upgrade their Send Token V0 to Send Token V1', async ({
  page,
  seed,
  supabase,
  sendAccount,
}) => {
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
  await expect(() =>
    page
      .getByRole('button', { name: 'UPGRADING...' })
      .waitFor({ state: 'detached', timeout: 2_000 })
  ).toPass({
    timeout: 10_000,
  })

  // should see the Send Token V1 balance
  const sendTokenV1Balance = await lookupBalance({
    address: sendAccount.address as `0x${string}`,
    token: sendCoin.token,
  })
  expect(sendTokenV1Balance).toEqual(parseUnits((balance / 100n).toString(), sendCoin.decimals))

  // send token v0 balance should be 0
  const sendTokenV0Balance = await lookupBalance({
    address: sendAccount.address as `0x${string}`,
    token: sendV0Coin.token,
  })
  expect(sendTokenV0Balance).toEqual(0n)
})