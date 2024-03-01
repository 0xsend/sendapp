import { Page } from '@playwright/test'
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
  8008: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  845337: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const

let log: debug.Debugger

const sendAccountTest = base.extend<{
  page: Page
}>({
  page: async ({ page, context, supabase }, use) => {
    log = debug(`test:send-accounts:${test.info().workerIndex}}`)

    // @todo use webauthn authenticator and supabase API to create a send account
    const onboardingPage = new OnboardingPage(await context.newPage())
    await onboardingPage.completeOnboarding(expect)

    const { data: sendAccount, error } = await supabase.from('send_accounts').select('*').single()
    if (error) {
      log('error fetching send account', error)
      throw error
    }
    assert(!!sendAccount, 'no send account found')
    assert(sendAccount.address !== zeroAddress, 'send account address is zero')

    log('fund send account', sendAccount.address)
    await testBaseClient.setBalance({
      address: sendAccount.address,
      value: parseEther('1'),
    })
    await setERC20Balance({
      client: testBaseClient,
      address: sendAccount.address,
      tokenAddress: usdcAddress[testBaseClient.chain.id],
      value: 100n * 10n ** 6n,
    })
    await onboardingPage.page.close() // close the onboarding page

    await use(page)
  },
})
export const test = sendAccountTest

export const expect = test.expect
