import { Page } from '@playwright/test'
import { test as base } from '../auth'
import { OnboardingPage } from './page'

const sendAccountTest = base.extend<{
  page: Page
}>({
  page: async ({ page, context, supabase }, use) => {
    const onboardingPage = new OnboardingPage(await context.newPage())
    await onboardingPage.completeOnboarding(expect)
    const { count, error } = await supabase
      .from('send_accounts')
      .select('*', { count: 'exact' })
      .single()
    if (error) {
      throw error
    }
    expect(count).toBe(1)
    await onboardingPage.page.close()
    await use(page)
  },
})
export const test = sendAccountTest

export const expect = test.expect
