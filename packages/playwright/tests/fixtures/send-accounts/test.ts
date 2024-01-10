import { Page } from '@playwright/test'
import { test as base } from '../auth'

const sendAccountTest = base.extend<{
  page: Page
}>({
  page: async ({ page, context, supabase }, use) => {
    // TODO: create a send account directly with the API
    const onboardingPage = await context.newPage()
    await onboardingPage.goto('/')
    expect(onboardingPage).toHaveURL('/onboarding') // no send accounts redirects to onboarding page

    // choose a random account name
    const acctName = `test-${Math.floor(Math.random() * 1000000)}`
    await onboardingPage.getByRole('textbox', { name: 'Account name:' }).fill(acctName)
    await expect(onboardingPage.getByLabel('Account name:')).toHaveValue(acctName)

    await onboardingPage.getByRole('button', { name: 'Create' }).click()
    await onboardingPage.getByRole('button', { name: 'Create' }).waitFor({ state: 'detached' })
    const { count, error } = await supabase
      .from('send_accounts')
      .select('*', { count: 'exact' })
      .single()
    if (error) {
      throw error
    }
    expect(count).toBe(1)
    await onboardingPage.close()

    await use(page)
  },
})
export const test = sendAccountTest

export const expect = test.expect
