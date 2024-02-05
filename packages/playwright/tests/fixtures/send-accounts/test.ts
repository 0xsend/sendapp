import { Page } from '@playwright/test'
import { test as base } from '../auth'
import { OnboardingPage } from './page'
import { testBaseClient } from '../viem/base'
import { assert } from 'app/utils/assert'
import { parseEther } from 'viem'
import { debug } from 'debug'

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

    log('fund send account', sendAccount.address)
    await testBaseClient.setBalance({
      address: sendAccount.address,
      value: parseEther('1'),
    })
    await onboardingPage.page.close() // close the onboarding page

    await use(page)
  },
})
export const test = sendAccountTest

export const expect = test.expect
