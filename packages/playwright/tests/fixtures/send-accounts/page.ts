import type { Expect, Page } from '@playwright/test'
import { generateSendtag } from '@my/playwright/utils/generators'

export class OnboardingPage {
  constructor(
    public readonly page: Page,
    public readonly log?: debug.Debugger
  ) {}

  async completeOnboarding(expect: Expect) {
    await this.page.goto('/')
    expect(this.page).toHaveURL('/auth/onboarding') // no send accounts redirects to onboarding page

    const sendtag = generateSendtag()
    await this.page.getByTestId('sendtag-input').fill(sendtag)

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
      timeout: 30_000,
    })

    await this.page.getByRole('button', { name: 'finish account' }).click()
    await request
    await response
    await this.page.getByRole('button', { name: 'finish account' }).waitFor({ state: 'detached' })

    await this.page.waitForURL('/')
  }
}
