import type { Expect, Locator, Page } from '@playwright/test'
import debug from 'debug'
import type { Web3ProviderBackend } from '@0xbigboss/headless-web3-provider'

const log = debug('test:fixtures:checkout:page')

export class CheckoutPage {
  public readonly pricingDialog: Locator
  public readonly pricingTooltip: Locator
  public readonly confirmDialog: Locator
  public readonly submitTagButton: Locator
  constructor(
    public readonly page: Page,
    public readonly wallet: Web3ProviderBackend
  ) {
    this.pricingDialog = page.getByLabel('Sendtag Pricing')
    this.pricingTooltip = page.getByTestId('SendTagPricingTooltipContent')
    this.confirmDialog = page.getByLabel('Confirming Sendtags')
    this.submitTagButton = page.getByRole('button', { name: 'add tag' })
  }

  async goto() {
    log('goto /account/sendtag/checkout')
    await this.page.goto('/account/sendtag/checkout')
    await this.page.waitForURL('/account/sendtag/checkout')
  }

  async confirmTags(expect: Expect) {
    // sign transaction
    log('sign transaction')
    const confirmTagsRequest = this.page.waitForRequest(
      (request) => {
        if (request.url().includes('/api/trpc/tag.confirm')) {
          log('confirmTags request', request.url(), request.method(), request.postDataJSON())
          return request.url().includes('/api/trpc/tag.confirm') && request.method() === 'POST'
        }
        return false
      },
      {
        timeout: 15_000,
      }
    )
    const confirmTagsResponse = this.page.waitForEvent('response', {
      predicate: async (response) => {
        const json = await response.json().catch(() => ({}))
        if (response.url().includes('/api/trpc/tag.confirm')) {
          log('confirmTags response', response.url(), response.status(), await response.text())
          const error = json?.[0]?.error
          if (error) {
            log('confirmTags error', error)
            expect(error).toBeFalsy()
          }
          return json?.[0]?.result?.data?.json === ''
        }
        return false
      },
      timeout: 10_000,
    })
    const signTransactionButton = this.page.getByRole('button', { name: 'complete purchase' })
    await expect?.(signTransactionButton).toBeEnabled({ timeout: 20_000 }) // blockchain stuff is a bit slow
    await this.page.bringToFront()
    const errorButton = this.page.getByRole('button', { name: 'error' })
    expect?.(errorButton).toBeHidden()
    await this.page
      .getByRole('button', { name: 'loading' })
      .waitFor({ state: 'detached', timeout: 15_000 })
    await signTransactionButton.click()
    await confirmTagsRequest
    await confirmTagsResponse
    await this.page.waitForURL('/account/sendtag')
  }
}
