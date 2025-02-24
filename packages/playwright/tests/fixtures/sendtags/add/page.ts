import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import debug from 'debug'
import type { Web3ProviderBackend } from '@0xbigboss/headless-web3-provider'

const log = debug('test:fixtures:sendtags-add:page')

export class AddSendtagsPage {
  public readonly pricingDialog: Locator
  public readonly pricingTooltip: Locator
  public readonly submitTagButton: Locator
  constructor(
    public readonly page: Page,
    public readonly wallet: Web3ProviderBackend
  ) {
    this.pricingDialog = page.getByLabel('Sendtag Pricing')
    this.pricingTooltip = page.getByTestId('SendTagPricingTooltipContent')
    this.submitTagButton = page.getByRole('button', { name: 'Add Tag' })
  }

  async goto() {
    log('goto /account/sendtag/add')
    await this.page.goto('/account/sendtag/add')
    await this.page.waitForURL('/account/sendtag/add')
  }

  async fillTagName(tag: string) {
    await expect(async () => {
      await this.page.getByPlaceholder('Enter Sendtag name').fill(tag)
      expect(await this.page.getByPlaceholder('Enter Sendtag name').inputValue()).toEqual(tag)
    }).toPass({
      timeout: 5_000,
    })
  }

  async submitTagName() {
    await expect(async () => {
      const request = this.page.waitForRequest(
        (request) => {
          if (request.url().includes('/rest/v1/tags') && request.method() === 'POST') {
            log('submitTagName request', request.url(), request.method(), request.postDataJSON())
            return true
          }
          return false
        },
        { timeout: 5_000 }
      )
      const response = this.page.waitForEvent('response', {
        predicate: async (response) => {
          if (response.url().includes('/rest/v1/tags')) {
            log('submitTagName response', response.url(), response.status(), await response.text())
            return true
          }
          return false
        },
        timeout: 5_000,
      })
      await this.submitTagButton.click()
      await request
      await response
    }).toPass({
      timeout: 20_000,
    })
  }

  async addPendingTag(tag: string) {
    await this.fillTagName(tag)
    await this.submitTagName()
  }

  async openPricingDialog() {
    await this.page.getByRole('button', { name: 'Pricing', exact: true }).first().click()
    await this.pricingDialog.isVisible()
  }

  async openPricingTooltip() {
    await expect(() => this.page.getByRole('button', { name: 'Pricing' }).hover()).toPass({
      timeout: 5_000,
    })
  }
}
