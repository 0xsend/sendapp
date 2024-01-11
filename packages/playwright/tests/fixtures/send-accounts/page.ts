import { Expect, Page } from '@playwright/test'

export class OnboardingPage {
  constructor(public readonly page: Page) {}

  public readonly accountName = `test-${Math.floor(Math.random() * 1000000)}`

  async completeOnboarding(expect: Expect<OnboardingPage>) {
    // TODO: create a send account directly with the API
    await this.page.goto('/')
    expect(this.page).toHaveURL('/onboarding') // no send accounts redirects to onboarding page

    // choose a random account name
    const acctName = this.accountName
    await this.page.getByRole('textbox', { name: 'Account name:' }).fill(acctName)
    await expect(this.page.getByLabel('Account name:')).toHaveValue(acctName)

    await this.page.getByRole('button', { name: 'Create' }).click()
    await this.page.getByRole('button', { name: 'Create' }).waitFor({ state: 'detached' })
  }
}
