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
    // The amount input in SendChat has testID="SendChatAmountInput"
    this.amountInput = page.getByTestId('SendChatAmountInput')
    // The clickable wrapper that triggers enterAmount section
    this.enterAmountTrigger = page.getByTestId('SendChatEnterAmountTrigger')
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
   * After page reload, the modal should auto-open if URL has send params.
   */
  async enterAmountSection() {
    // First, ensure the SendChat modal is visible (it auto-opens if URL has send params)
    await this.expect(this.page.getByTestId('SendChat')).toBeVisible({ timeout: 10_000 })

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

      // Click the trigger to transition from chat to enterAmount section
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
      // Use getByRole('listbox') to scope to the dropdown, then find the token option
      const tokenOption = this.page.getByRole('listbox').getByLabel(tokenSymbol).first()
      await this.expect(tokenOption).toBeVisible()
      await tokenOption.click()
      // Wait for dropdown to close
      await this.expect(this.page.getByRole('listbox')).toBeHidden({ timeout: 5000 })
    }).toPass({
      timeout: 10_000,
    })

    // Wait for balance to be loaded (needed before we can submit)
    // The balance display has testID="SendFormBalance" and shows e.g., "Balance: 100 USDC"
    await this.expect(async () => {
      // Wait for the balance to show a non-zero value (not just "Balance: --")
      const balanceEl = this.page.getByTestId('SendFormBalance')
      await this.expect(balanceEl).toBeVisible()
      const balanceText = await balanceEl.textContent()
      // Balance format: "Balance: 1,234.5678" or "Balance: --" when loading
      if (!balanceText || balanceText.includes('--')) {
        throw new Error(`Balance not loaded yet: ${balanceText}`)
      }
    }).toPass({
      timeout: 15_000,
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
      // Wait for transition to reviewAndSend section - button text changes to "Send"
      await this.expect(this.sendButton).toBeVisible()
    }).toPass({
      timeout: 15_000,
    })

    // Click final Send button - wait for it to be enabled (data loaded)
    // This can take time as the app needs to estimate gas fees and verify balance
    await this.expect(async () => {
      await this.expect(this.sendButton).toBeEnabled()
      await this.sendButton.click()
    }).toPass({
      timeout: 30_000,
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
