import { Expect, Page } from '@playwright/test'

export class OnboardingPage {
  constructor(public readonly page: Page) {}

  public readonly accountName = `test-${Math.floor(Math.random() * 1000000)}`

  async completeOnboarding(expect: Expect<OnboardingPage>) {
    await this.page.goto('/')
    expect(this.page).toHaveURL('/onboarding') // no send accounts redirects to onboarding page

    // choose a random account name
    const acctName = this.accountName
    await this.page.getByRole('textbox', { name: 'Passkey name' }).fill(acctName)
    await expect(this.page.getByLabel('Passkey name')).toHaveValue(acctName)

    await this.page.getByRole('button', { name: 'Create' }).click()
    // @todo add a check for the success message
    await this.page.getByRole('button', { name: 'Create' }).waitFor({ state: 'detached' })
  }
}
