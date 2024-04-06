import type { Expect, Page } from '@playwright/test'

export class OnboardingPage {
  constructor(public readonly page: Page) {}

  public readonly accountName = `test-${Math.floor(Math.random() * 1000000)}`

  async completeOnboarding(expect: Expect<OnboardingPage>) {
    await this.page.goto('/')
    expect(this.page).toHaveURL('/auth/onboarding') // no send accounts redirects to onboarding page

    // choose a random account name
    const acctName = this.accountName
    await this.page.getByRole('textbox', { name: 'Account name' }).fill(acctName)
    await expect(this.page.getByLabel('Account name')).toHaveValue(acctName)

    await this.page.getByRole('button', { name: 'Create Passkey' }).click()
    // @todo add a check for the success message
    await this.page.getByRole('button', { name: 'Create Passkey' }).waitFor({ state: 'detached' })
    await this.page.waitForURL('/')
  }
}
