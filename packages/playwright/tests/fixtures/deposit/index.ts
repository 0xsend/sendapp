import { type Locator, mergeTests, type Page } from '@playwright/test'
import { test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import debug, { log } from 'debug'

const baseTest = mergeTests(sendAccountTest, snapletTest)

export const test = baseTest.extend<{
  earnDepositPage: EarnDepositPage
}>({
  earnDepositPage: async ({ page }, use) => {
    const log = debug(`test:earn:deposit:${test.info().parallelIndex}`)
    log('creating sendEarnDepositPage')
    const sendEarnDepositPage = new EarnDepositPage(page)
    await sendEarnDepositPage.goto()
    await use(sendEarnDepositPage)
  },
})

export const expect = test.expect

/**
 * Page object for the earn deposit page
 */
class EarnDepositPage {
  public readonly startEarningButton: Locator
  public readonly amountInput: Locator
  public readonly termsCheckbox: Locator
  public readonly submitButton: Locator

  constructor(public page: Page) {
    this.startEarningButton = this.page.getByRole('button', { name: 'Start Earning' })
    this.amountInput = this.page.getByPlaceholder('0')
    this.termsCheckbox = this.page.getByTestId('DepositForm').getByRole('checkbox')
    this.submitButton = this.page.getByRole('button', { name: 'Confirm Deposit' })
  }

  async goto() {
    log('goto /earn')
    await this.page.goto('/')
    await this.page.getByRole('link', { name: 'Earn', exact: true }).click()
    await this.page.waitForURL('/earn')
    await expect(this.startEarningButton).toBeVisible()
    await this.startEarningButton.click()
    await this.page.waitForURL('/earn/deposit')
    await expect(this.page.getByText('Start Earning', { exact: true })).toBeVisible()
    await expect(this.amountInput).toBeVisible()
    await expect(this.termsCheckbox).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }

  async fillAmount(amount: string) {
    await expect(async () => {
      await this.amountInput.fill(amount)
    }).toPass({
      timeout: 5_000,
    })
  }

  async acceptTerms() {
    await expect(async () => {
      await this.termsCheckbox.check()
      expect(await this.termsCheckbox.isChecked()).toBeTruthy()
    }).toPass({
      timeout: 5_000,
    })
  }

  async submit() {
    await expect(async () => {
      await this.page.getByRole('button', { name: 'Confirm Deposit' }).click()
      await expect(this.page.getByText('Deposited successfully', { exact: true })).toBeVisible()
      await this.page.waitForURL('/earn')
    }).toPass({
      timeout: 15_000,
    })
  }
}
