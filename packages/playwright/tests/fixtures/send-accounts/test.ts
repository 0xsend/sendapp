import type { Tables } from '@my/supabase/database-generated.types'
import { usdcAddress } from '@my/wagmi'
import type { Expect, Page } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import debug from 'debug'
import { parseEther, zeroAddress } from 'viem'
import { test as base } from '../auth'
import { testBaseClient } from '../viem/base'
import { OnboardingPage } from './page'

let log: debug.Debugger

export const signUp = async (page: Page, phone: string, expect: Expect) => {
  await page.getByLabel('Phone number').fill(phone)
  const signUpButton = page.getByRole('button', { name: 'Sign Up' })
  await expect(signUpButton).toBeVisible()
  await expect(signUpButton).toBeEnabled()
  await signUpButton.click()
  const otpInput = page.getByLabel('One-time Password')
  await expect(otpInput).toBeVisible()
  await otpInput.fill('123456')
  const verifyAccountButton = page.getByRole('button', { name: 'VERIFY ACCOUNT' })
  await expect(verifyAccountButton).toBeVisible()
  await verifyAccountButton.click()
  await page.waitForLoadState()
  await expect(page).toHaveURL('/auth/onboarding')
  const onboardingPage = new OnboardingPage(page)
  await onboardingPage.completeOnboarding(expect)
}

const sendAccountTest = base.extend<{
  page: Page
  sendAccount: Tables<'send_accounts'>
  setEthBalance: ({ address, value }: { address: `0x${string}`; value: bigint }) => Promise<void>
  setUsdcBalance: ({ address, value }: { address: `0x${string}`; value: bigint }) => Promise<void>
}>({
  sendAccount: [
    async ({ context, supabase, setEthBalance, setUsdcBalance, user: { user } }, use) => {
      log = debug(`test:send-accounts:${user.id}:${test.info().parallelIndex}`)
      log('start onboarding')

      // @todo use webauthn authenticator and supabase API to create a send account
      const onboardingPage = new OnboardingPage(await context.newPage(), log)
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

      await use(sendAccount)
    },
    { timeout: 20000, scope: 'test' },
  ],
  page: [({ sendAccount: _, page }, use) => use(page), { scope: 'test' }],
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
