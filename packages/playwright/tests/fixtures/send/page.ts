import type { Expect, Locator, Page } from '@playwright/test'

/**
 * Page object for the SendChat interface.
 *
 * The send flow uses a modal with three sections:
 * 1. 'chat' - shows transaction history, "Type amount, add a note..." input
 * 2. 'enterAmount' - shows amount input, coin selector, review button
 * 3. 'reviewAndSend' - shows confirmation, send button
 *
 * Click the "Type amount, add a note..." input to transition from chat to enterAmount.
 */
export class SendPage {
  readonly page: Page
  readonly expect: Expect
  readonly amountInput: Locator
  readonly enterAmountTrigger: Locator
  readonly reviewButton: Locator
  readonly continueButton: Locator // Alias for reviewButton for backward compatibility
  readonly sendButton: Locator
  readonly tokenSelect: Locator

  constructor(page: Page, expect: Expect) {
    this.page = page
    this.expect = expect
    // The amount input in SendChat uses placeholder "0" - use getByRole for more reliable matching
    this.amountInput = page.locator('input[placeholder="0"]')
    // The clickable wrapper is a View with tabindex="0" containing the Input
    // Target the focusable parent, not the Input which has pointerEvents: none
    this.enterAmountTrigger = page.locator('[tabindex="0"]').filter({
      has: page.locator('input[placeholder*="Type amount"]'),
    })
    // Review button transitions to reviewAndSend section
    this.reviewButton = page.getByRole('button', { name: 'Review and Send' })
    // Alias for backward compatibility with tests using continueButton
    this.continueButton = this.reviewButton
    // Final send button in reviewAndSend section
    this.sendButton = page.getByRole('button', { name: 'Send', exact: true })
    this.tokenSelect = page.getByTestId('SelectCoinTrigger')
  }

  /**
   * Enter the amount entry section from the chat section.
   * After page reload, the modal resets to 'chat' section.
   */
  async enterAmountSection() {
    await this.expect(async () => {
      // Check if already in enterAmount section (amount input visible)
      if (await this.amountInput.isVisible()) {
        return
      }
      // Check if we're in chat section - look for "You're Sending" which indicates enterAmount
      const youSendingVisible = await this.page.getByText("You're Sending").isVisible()
      if (youSendingVisible) {
        // Already transitioning or in enterAmount
        await this.expect(this.amountInput).toBeVisible()
        return
      }

      // Click the focusable View wrapper to trigger onPress -> setActiveSection('enterAmount')
      if (await this.enterAmountTrigger.isVisible()) {
        await this.enterAmountTrigger.click()
      }
      // Wait for amount input to be visible (indicates we're in enterAmount section)
      await this.expect(this.amountInput).toBeVisible()
    }).toPass({
      timeout: 15_000,
    })
  }

  async expectTokenSelect(tokenSymbol: string) {
    // Ensure we're in the enterAmount section first
    await this.enterAmountSection()

    await this.expect(async () => {
      await this.expect(this.tokenSelect).toBeVisible()
      await this.tokenSelect.click()
      const tokenOption = this.page.getByLabel(tokenSymbol)
      await tokenOption.click()
      if (await tokenOption.isVisible()) {
        await tokenOption.click() // sometimes firefox needs a double click
      }
      await this.expect(tokenOption).toBeHidden()
    }).toPass({
      timeout: 10_000,
    })
  }

  async fillAndSubmitForm(amount: string) {
    // Ensure we're in the enterAmount section
    await this.enterAmountSection()

    await this.expect(this.amountInput).toBeVisible()
    await this.amountInput.fill(amount)

    // Click Review and Send to go to reviewAndSend section
    await this.expect(async () => {
      await this.expect(this.reviewButton).toBeVisible()
      await this.expect(this.reviewButton).toBeEnabled()
      await this.reviewButton.click()
    }).toPass({
      timeout: 10_000,
    })

    // Click final Send button
    await this.expect(async () => {
      await this.expect(this.sendButton).toBeVisible()
      await this.expect(this.sendButton).toBeEnabled()
      await this.sendButton.click()
    }).toPass({
      timeout: 10_000,
    })
  }

  async waitForSendingCompletion() {
    await this.expect(async () => {
      // After send, we return to chat section or navigate away
      // Check that the send button is no longer visible
      const sendVisible = await this.sendButton.isVisible().catch(() => false)
      if (sendVisible) {
        throw new Error('Send button still visible')
      }
    }).toPass({
      timeout: 15_000,
    })
  }

  async expectNoSendError() {
    await this.expect(this.page.getByTestId('SendConfirmError')).toBeHidden()
  }
}
