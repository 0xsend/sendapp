import type { Tables } from '@my/supabase/database.types'
import type { Expect, Page } from '@playwright/test'
import { ethCoin, usdcCoin } from 'app/data/coins'
import { assert } from 'app/utils/assert'
import debug from 'debug'
import { parseEther, withRetry, zeroAddress } from 'viem'
import { test as base } from '../auth'
import { fund } from '../viem'
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
}>({
  sendAccount: [
    async ({ context, supabase, user: { user } }, use) => {
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

      await Promise.all([
        withRetry(
          () => fund({ address: sendAccount.address, amount: parseEther('1'), coin: ethCoin }),
          {
            delay: 250,
            retryCount: 40,
          }
        ),
        withRetry(
          () => fund({ address: sendAccount.address, amount: 100n * 10n ** 6n, coin: usdcCoin }),
          {
            delay: 250,
            retryCount: 40,
          }
        ),
      ])

      await onboardingPage.page.close() // close the onboarding page

      await use(sendAccount)
    },
    { timeout: 20000, scope: 'test' },
  ],
  page: [({ sendAccount: _, page }, use) => use(page), { scope: 'test' }],
})
export const test = sendAccountTest

export const expect = test.expect
