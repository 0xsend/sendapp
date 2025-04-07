import { test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { type Locator, mergeTests, type Page } from '@playwright/test'
import debug from 'debug'

const baseTest = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

export const test = baseTest.extend<{
  swapFormPage: SwapFormPage
  swapSummaryPage: SwapSummaryPage
}>({
  swapFormPage: async ({ page }, use) => {
    log = debug(`test:swap:form:${test.info().parallelIndex}`)
    log('creating swapFormPage')
    const swapFormPage = new SwapFormPage(page)
    await use(swapFormPage)
  },
  swapSummaryPage: async ({ page }, use) => {
    log = debug(`test:swap:summary:${test.info().parallelIndex}`)
    log('creating swapSummaryPage')
    const swapSummaryPage = new SwapSummaryPage(page)
    await use(swapSummaryPage)
  },
})

export const expect = test.expect

export class SwapFormPage {
  public readonly inAmountInput: Locator
  public readonly inTokenSelectTrigger: Locator
  public readonly inTokenSelectValue: Locator
  public readonly flipTokensButton: Locator
  public readonly outAmountInput: Locator
  public readonly outTokenSelectValue: Locator
  public readonly outTokenSelectTrigger: Locator
  public readonly slippageDetailsButton: Locator
  public readonly customSlippageInput: Locator
  public readonly reviewButton: Locator
  public readonly swapRiskDialogContent: Locator
  public readonly swapRiskDialogCheckbox: Locator
  public readonly swapRiskDialogCancelButton: Locator
  public readonly swapRiskDialogContinueButton: Locator

  constructor(public page: Page) {
    this.inAmountInput = this.page.getByTestId('inAmountInput')
    this.inTokenSelectTrigger = this.page.getByTestId('SelectCoinTrigger').first()
    this.inTokenSelectValue = this.page.getByTestId('SelectCoinValue').first()
    this.flipTokensButton = this.page.getByTestId('flipTokensButton')
    this.outAmountInput = this.page.getByTestId('outAmountInput')
    this.outTokenSelectTrigger = this.page.getByTestId('SelectCoinTrigger').last()
    this.outTokenSelectValue = this.page.getByTestId('SelectCoinValue').last()
    this.slippageDetailsButton = this.page.getByTestId('slippageDetailsButton')
    this.customSlippageInput = this.page.getByTestId('customSlippageInput')
    this.reviewButton = this.page.getByRole('button', { name: 'review' })
    this.swapRiskDialogContent = this.page.getByTestId('swapRiskDialogContent')
    this.swapRiskDialogCheckbox = this.page.getByTestId('swapRiskDialogCheckbox')
    this.swapRiskDialogCancelButton = this.page.getByTestId('swapRiskDialogCancelButton')
    this.swapRiskDialogContinueButton = this.page.getByTestId('swapRiskDialogContinueButton')
  }

  async validatePageVisible() {
    await expect(async () => {
      await expect(this.inAmountInput).toBeVisible()
      await expect(this.inTokenSelectTrigger).toBeVisible()
      await expect(this.flipTokensButton).toBeVisible()
      await expect(this.outAmountInput).toBeVisible()
      await expect(this.outTokenSelectTrigger).toBeVisible()
      await expect(this.slippageDetailsButton).toBeVisible()
      await expect(this.customSlippageInput).not.toBeVisible()
      await expect(this.swapRiskDialogContent).toBeVisible()
      await expect(this.swapRiskDialogCheckbox).toBeVisible()
      await expect(this.swapRiskDialogCancelButton).toBeVisible()
      await expect(this.swapRiskDialogContinueButton).toBeVisible()
    }).toPass({ timeout: 15_000 })
  }

  async goto() {
    log('goto /trade')
    await this.page.goto('/')
    await this.page.getByRole('link', { name: 'Trade' }).nth(0).click()
    await this.page.waitForURL('/trade')
    await this.validatePageVisible()
  }

  async closeRiskDialog() {
    await expect(async () => {
      await this.swapRiskDialogCancelButton.click()
    }).toPass({ timeout: 1_000 })
  }

  async acceptRiskDialog() {
    await expect(async () => {
      await this.swapRiskDialogCheckbox.check()
      await this.swapRiskDialogContinueButton.click()
    }).toPass({ timeout: 3_000 })
  }

  async fillInAmount(inAmount: string) {
    await expect(async () => {
      await this.inAmountInput.fill(inAmount)
    }).toPass({ timeout: 3_000 })
  }

  async selectInToken(inToken: string) {
    await expect(async () => {
      await this.inTokenSelectTrigger.click()
      const tokenOption = this.page.getByLabel(inToken).first()
      await tokenOption.click()
      if (await tokenOption.isVisible()) {
        await tokenOption.click() // sometimes firefox needs a double click
      }
      await expect(tokenOption).toBeHidden()
    }).toPass({ timeout: 3_000 })
  }

  async selectOutToken(outToken: string) {
    await expect(async () => {
      await this.outTokenSelectTrigger.click()
      const tokenOption = this.page.getByLabel(outToken).last()
      await tokenOption.click()
      if (await tokenOption.isVisible()) {
        await tokenOption.click() // sometimes firefox needs a double click
      }
      await expect(tokenOption).toBeHidden()
    }).toPass({ timeout: 3_000 })
  }

  async flipTokens() {
    await expect(async () => {
      await this.flipTokensButton.click()
    }).toPass({ timeout: 1_000 })
  }

  async fillCustomSlippage(customSlippage: string) {
    await expect(async () => {
      await this.slippageDetailsButton.click()
      await this.customSlippageInput.isVisible()
      await this.customSlippageInput.fill(customSlippage)
    }).toPass({ timeout: 3_000 })
  }

  async waitForSwapRouteResponse() {
    await expect(async () => {
      await this.page.waitForResponse(
        (response) =>
          response.url().includes('/api/trpc/swap.fetchSwapRoute') && response.status() === 200
      )
      // response need to be set saved in cache before clicking, playwright is too fast
      await this.page.waitForTimeout(1000)
    }).toPass({ timeout: 15_000 })
  }

  async reviewSwap() {
    await expect(async () => {
      await this.reviewButton.click()
    }).toPass({ timeout: 1_000 })
  }

  async fillSwapForm({
    inToken,
    outToken,
    inAmount,
    customSlippage,
  }: {
    inAmount: string
    inToken: string
    outToken: string
    customSlippage: string
  }) {
    await expect(async () => {
      await this.selectInToken(inToken)
      // need to wait till param is populated to url before changing out token, couldn't make any other more distinguished wait code to work
      await this.page.waitForTimeout(1_000)
      await this.selectOutToken(outToken)
      await this.fillInAmount(inAmount)
      await this.fillCustomSlippage(customSlippage)
    }).toPass({ timeout: 5_000 })
  }

  async validateCustomSlippage(customSlippage: string) {
    await expect(async () => {
      await this.slippageDetailsButton.click()
      await this.customSlippageInput.isVisible()
      await expect(this.customSlippageInput).toHaveValue(customSlippage)
    }).toPass({ timeout: 3_000 })
  }

  async validateSwapForm({
    inToken,
    outToken,
    inAmount,
    customSlippage,
  }: {
    inAmount: string
    inToken: string
    outToken: string
    customSlippage: string
  }) {
    await expect(async () => {
      await expect(this.inAmountInput).toHaveValue(inAmount)
      await expect(this.inTokenSelectValue).toHaveText(inToken)
      await expect(this.outTokenSelectValue).toHaveText(outToken)
      await this.validateCustomSlippage(customSlippage)
    }).toPass({ timeout: 5_000 })
  }
}

export class SwapSummaryPage {
  public readonly swapInAmount: Locator
  public readonly inTokenSymbol: Locator
  public readonly swapOutAmount: Locator
  public readonly outTokenSymbol: Locator
  public readonly exchangeRate: Locator
  public readonly slippage: Locator
  public readonly swapButton: Locator

  constructor(public page: Page) {
    this.swapInAmount = this.page.getByTestId('swapInAmount')
    this.inTokenSymbol = this.page.getByTestId('inTokenSymbol')
    this.swapOutAmount = this.page.getByTestId('swapOutAmount')
    this.outTokenSymbol = this.page.getByTestId('outTokenSymbol')
    this.exchangeRate = this.page.getByTestId('exchangeRate')
    this.slippage = this.page.getByTestId('slippage')
    this.swapButton = this.page.getByRole('button', { name: 'confirm trade' })
  }

  async goto() {
    log('goto /trade/summary')
    await this.page.goto('/trade/summary')
  }

  async validateSummary({
    inAmount,
    outToken,
    inToken,
    outAmount,
    exchangeRate,
    slippage,
  }: {
    inAmount: string
    outAmount: string
    inToken: string
    outToken: string
    slippage: number
    exchangeRate: string
  }) {
    await expect(async () => {
      const request = await this.page.waitForRequest('/api/trpc/swap.encodeSwapRoute?batch=1')
      const requestPayload = request.postDataJSON()
      expect(requestPayload['0'].json.slippageTolerance).toEqual(slippage * 100)
      await expect(this.swapInAmount).toHaveText(inAmount)
      await expect(this.inTokenSymbol).toHaveText(inToken)
      await expect(this.swapOutAmount).toHaveText(outAmount)
      await expect(this.outTokenSymbol).toHaveText(outToken)
      await expect(this.slippage).toHaveText(`${slippage}%`)
      await expect(this.exchangeRate).toHaveText(exchangeRate)
    }).toPass({ timeout: 20_000 })
  }

  async confirmSwap() {
    await expect(async () => {
      await this.swapButton.click()
    }).toPass({ timeout: 10_000 })
  }
}
