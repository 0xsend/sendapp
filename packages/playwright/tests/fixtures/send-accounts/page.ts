import type { Expect, Page } from '@playwright/test'
import { generateSendtag } from '@my/playwright/utils/generators'

export class OnboardingPage {
  constructor(
    public readonly page: Page,
    public readonly log?: debug.Debugger
  ) {}

  async completeOnboarding(expect: Expect) {
    // Navigate to home and wait for network to settle
    await this.page.goto('/', { waitUntil: 'networkidle' })

    // Check if we're already on onboarding (auto-redirect happened)
    if (this.page.url().includes('/auth/onboarding')) {
      this.log?.('already on onboarding page')
    } else {
      // Wait for the fallback UI to appear - the "Go To Onboarding" button
      const goToOnboardingBtn = this.page.getByRole('button', { name: 'Go To Onboarding' })
      this.log?.('waiting for Go To Onboarding button')
      await goToOnboardingBtn.waitFor({ state: 'visible', timeout: 30_000 })
      this.log?.('clicking Go To Onboarding button')
      await goToOnboardingBtn.click()
      await this.page.waitForURL('/auth/onboarding')
    }

    this.log?.('on onboarding page')

    const sendtag = generateSendtag()
    await this.page.getByTestId('sendtag-input').fill(sendtag)

    // Set up listeners for both API calls before clicking
    const createAccountResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/trpc/sendAccount.create') && response.status() === 200,
      { timeout: 30_000 }
    )

    const registerSendtagResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/trpc/tag.registerFirstSendtag') && response.status() === 200,
      { timeout: 30_000 }
    )

    // Click the submit button
    this.log?.('clicking finish account button')
    await this.page.getByRole('button', { name: 'finish account' }).click()

    // Wait for both API calls to complete
    this.log?.('waiting for sendAccount.create response')
    const createResponse = await createAccountResponse
    const createJson = await createResponse.json()
    this.log?.('sendAccount.create response', createResponse.status(), JSON.stringify(createJson))
    expect(createJson[0]?.error).toBeFalsy()

    this.log?.('waiting for registerFirstSendtag response')
    const registerResponse = await registerSendtagResponse
    const registerJson = await registerResponse.json()
    this.log?.(
      'registerFirstSendtag response',
      registerResponse.status(),
      JSON.stringify(registerJson)
    )
    expect(registerJson[0]?.error).toBeFalsy()

    // After both APIs complete, the page should redirect
    this.log?.('waiting for navigation back to home')
    await this.page.waitForURL('/', { timeout: 10_000 })
  }
}
