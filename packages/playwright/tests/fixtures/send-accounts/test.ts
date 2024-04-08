import type { Page } from '@playwright/test'
import { test as base } from '../auth'
import { OnboardingPage } from './page'
import { testBaseClient } from '../viem/base'
import { assert } from 'app/utils/assert'
import { parseEther, zeroAddress } from 'viem'
import { debug } from 'debug'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'

// @todo playwright is incompatible with esm modules only like wagmi, hardcode the USDC address
const usdcAddress = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  1337: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  845337: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const

let log: debug.Debugger

const sendAccountTest = base.extend<{
  page: Page
  setEthBalance: ({ address, value }: { address: `0x${string}`; value: bigint }) => Promise<void>
  setUsdcBalance: ({ address, value }: { address: `0x${string}`; value: bigint }) => Promise<void>
}>({
  page: async ({ page, context, supabase, setEthBalance, setUsdcBalance }, use) => {
    log = debug(`test:send-accounts:${test.info().workerIndex}}`)
    log('start onboarding')

    // @todo use webauthn authenticator and supabase API to create a send account
    const onboardingPage = new OnboardingPage(await context.newPage())
    await onboardingPage.completeOnboarding(expect).catch((e) => {
      log('onboarding error', e)
      throw e
    })
    log('onboarding complete')

    const { data: sendAccount, error } = await supabase.from('send_accounts').select('*').single()
    if (error) {
      log('error fetching send account', error)
      throw error
    }
    assert(!!sendAccount, 'no send account found')
    assert(sendAccount.address !== zeroAddress, 'send account address is zero')

    await setEthBalance({ address: sendAccount.address, value: parseEther('1') })
    await setUsdcBalance({ address: sendAccount.address, value: 100n * 10n ** 6n })

    await onboardingPage.page.close() // close the onboarding page

    await use(page)
  },
  // biome-ignore lint/correctness/noEmptyPattern: playwright requires this
  setEthBalance: async ({}, use) => {
    use(async ({ address, value }) => {
      log('fund send account with eth', `address=${address} value=${value}`)
      await testBaseClient
        .setBalance({
          address,
          value,
        })
        .catch((e) => {
          log('setBalance error', e)
          throw e
        })
    })
  },
  // biome-ignore lint/correctness/noEmptyPattern: playwright requires this
  setUsdcBalance: async ({}, use) => {
    use(async ({ address, value }) => {
      log('fund send account with usdc', `address=${address} value=${value}`)
      await setERC20Balance({
        client: testBaseClient,
        address,
        tokenAddress: usdcAddress[testBaseClient.chain.id],
        value,
      })
    })
  },
})
export const test = sendAccountTest

export const expect = test.expect
