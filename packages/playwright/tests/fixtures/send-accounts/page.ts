import type { Expect, Page } from '@playwright/test'

export class OnboardingPage {
  constructor(
    public readonly page: Page,
    public readonly log?: debug.Debugger
  ) {}

  public readonly accountName = `test-${Math.floor(Math.random() * 1000000)}`

  async completeOnboarding(expect: Expect) {
    await this.page.goto('/')
    expect(this.page).toHaveURL('/auth/onboarding') // no send accounts redirects to onboarding page

    // choose a random account name
    const acctName = this.accountName
    await this.page.getByRole('textbox', { name: 'Account name' }).fill(acctName)
    await expect(this.page.getByLabel('Account name')).toHaveValue(acctName)

    const request = this.page.waitForRequest((request) => {
      if (request.url().includes('/api/trpc/sendAccount.create') && request.method() === 'POST') {
        this.log?.(
          'sendAccount.create request',
          request.url(),
          request.method(),
          request.postDataJSON()
        )
        return true
      }
      return false
    })
    const response = this.page.waitForEvent('response', {
      predicate: async (response) => {
        if (response.url().includes('/api/trpc/sendAccount.create')) {
          const json = await response.json()
          expect(json.data?.[0]?.error).toBeFalsy()
          this.log?.(
            'sendAccount.create response',
            response.url(),
            response.status(),
            JSON.stringify(json)
          )
          return true
        }
        return false
      },
      timeout: 15_000,
    })

    await this.page.getByRole('button', { name: 'Create Passkey' }).click()
    await request
    await response
    await this.page.getByRole('button', { name: 'Create Passkey' }).waitFor({ state: 'detached' })

    await this.page.waitForURL('/')
  }
}
