import path from 'path'
import type { BrowserContext, Locator, Page } from '@playwright/test'
import debug from 'debug'

const log = debug('test:fixtures:metamask:page')

const WALLET_PASSWORD = 'sendtest'

export class MetaMaskPage {
  public readonly extensionId: string

  constructor(public readonly page: Page) {
    this.extensionId = page.url().split('/')[2]!
  }

  static build = async (context: BrowserContext, extensionId: string) => {
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/home.html`)
    await page.bringToFront()
    await page.waitForLoadState()
    return new MetaMaskPage(page)
  }

  async waitForAlert() {
    log('waitForAlert')
    if (this.page.isClosed()) {
      log('waitForAlert: page is closed')
      return
    }
    const alert = this.page.getByRole('alert')
    if (!(await alert.isVisible())) {
      log('waitForAlert: alert is not visible')
      return
    }
    await alert.waitFor({ state: 'detached' })
  }

  async gotoHome() {
    log('gotoHome')
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`)
    await this.page.bringToFront()
    await this.page.waitForLoadState()
    await this.waitForAlert()
  }

  async unlockWallet() {
    log('unlockWallet')
    const passwordField = this.page.getByTestId('unlock-password')
    const submitButton = this.page.getByTestId('unlock-submit')
    await this.waitForAlert()
    if (await passwordField.isVisible()) {
      log('unlockWallet: entering password')
      await passwordField.fill(WALLET_PASSWORD)
      await submitButton.click()
      await this.waitForAlert()
    }
  }

  async setupWallet() {
    log('setupWallet')
    await this.gotoHome()

    await this.page.getByTestId('onboarding-terms-checkbox').click()
    await this.waitForAlert()
    await this.page.getByTestId('onboarding-import-wallet').click()
    await this.waitForAlert()
    await this.page.getByTestId('metametrics-no-thanks').click()
    await this.waitForAlert()

    // Enter the seed phrase
    const seeds = [...Array(11).fill('test'), 'junk']
    for (let i = 0; i < seeds.length; i++) {
      await this.page.getByTestId(`import-srp__srp-word-${i}`).fill(seeds[i])
    }
    await this.page.getByTestId('import-srp-confirm').click()
    await this.waitForAlert()

    // Enter the password
    await this.page.getByTestId('create-password-new').fill(WALLET_PASSWORD)
    await this.page.getByTestId('create-password-confirm').fill(WALLET_PASSWORD)
    await this.page.getByTestId('create-password-terms').click()
    await this.page.getByTestId('create-password-import').click()
    await this.waitForAlert()

    // Finish onboarding
    await this.page.getByTestId('onboarding-complete-done').click()
    await this.waitForAlert()
    await this.page.getByTestId('pin-extension-next').click()
    await this.waitForAlert()
    await this.page.getByTestId('pin-extension-done').click()
    await this.waitForAlert()
  }

  async takeScreenshot() {
    await this.page
      .screenshot({
        path: path.join('screenshots', `./metamask-${Date.now()}-${Math.random()}.png`),
      })
      .catch((e) => {
        log('takeScreenshot failed', e)
      })
  }

  async clickNextUntilDone() {
    log('clickNextUntilDone')

    if (this.page.isClosed()) {
      log('clickNextUntilDone: page is closed')
      return
    }

    await this.page.waitForLoadState()
    await this.waitForAlert()
    let nextButton: Locator | null
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        nextButton = this.page.getByTestId('page-container-footer-next')

        await Promise.all([
          this.page.getByText('Connecting...').waitFor({ state: 'detached' }),
          this.waitForAlert(),
        ])

        if (!(await nextButton.isVisible())) {
          log('clickNextUntilDone: next button is not visible')
          return
        }

        log('clickNextUntilDone: clicking next', `name=${await nextButton.textContent()}`)

        await nextButton.click()
      }
    } catch (e) {
      log('clickNextUntilDone: wait for loading', e)
      if (this.page.isClosed()) {
        log('clickNextUntilDone: page is closed')
        return
      }
      const msg = e.message
      if (msg.includes('Target closed')) {
        log('clickNextUntilDone: target closed')
        return
      }
      if (msg.includes('Target page, context or browser has been closed')) {
        log('clickNextUntilDone: target page, context or browser has been closed')
        return
      }
      throw e
    }
  }

  async closePopover() {
    log('closePopover')
    const closeButton = this.page.getByTestId('popover-close')
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  }
  async switchNetwork() {
    log('switchNetwork')
    await this.waitForAlert()
    await this.page.getByRole('button', { name: 'Approve' }).click() // click approve
    await this.page.getByRole('button', { name: 'Switch network' }).click() // click switch network
  }
}
