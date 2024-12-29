import type { Expect, Locator, Page } from '@playwright/test'

export class SendPage {
  readonly page: Page
  readonly expect: Expect
  readonly amountInput: Locator
  readonly continueButton: Locator
  readonly sendButton: Locator
  readonly tokenSelect: Locator

  constructor(page: Page, expect: Expect) {
    this.page = page
    this.expect = expect
    this.amountInput = page.getByLabel('amount')
    this.continueButton = page.getByRole('button', { name: 'CONTINUE', exact: true })
    this.sendButton = page.getByRole('button', { name: '/SEND' })
    this.tokenSelect = page.getByTestId('SelectCoinTrigger')
  }

  async expectTokenSelect(tokenSymbol: string) {
    await this.expect(this.tokenSelect).toBeVisible()
    await this.tokenSelect.click()
    await this.expect(this.tokenSelect).toBeVisible()
    const tokenOption = this.page.getByLabel(tokenSymbol)
    await tokenOption.click()
    if (await tokenOption.isVisible()) {
      await tokenOption.click() // sometimes firefox needs a double click
    }
    await this.expect(tokenOption).toBeHidden()
  }

  async fillAndSubmitForm(amount: string) {
    await this.expect(this.page.locator('h2', { hasText: 'Recipient' })).toBeVisible()
    await this.expect(this.amountInput).toBeVisible()
    await this.amountInput.fill(amount)
    await this.expect(this.continueButton).toBeVisible()
    await this.expect(this.continueButton).toBeEnabled()
    await this.continueButton.click()
    await this.expect(this.sendButton).toBeVisible()
    await this.sendButton.click()
  }

  async waitForSendingCompletion() {
    await this.expect(async () => {
      await this.expect(this.page.getByRole('button', { name: 'Sending...' })).toBeHidden()
    }).toPass({
      timeout: 10_000,
    })
  }

  async expectNoSendError() {
    await this.expect(this.page.getByTestId('SendConfirmError')).toBeHidden()
  }
}
