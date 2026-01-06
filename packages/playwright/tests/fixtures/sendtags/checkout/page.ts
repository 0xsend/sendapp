import type { Expect, Locator, Page } from '@playwright/test'
import debug from 'debug'
import type { Web3ProviderBackend } from '@0xbigboss/headless-web3-provider'

const log = debug('test:fixtures:checkout:page')

export class CheckoutPage {
  public readonly page: Page
  public readonly wallet: Web3ProviderBackend
  public readonly pricingDialog: Locator
  public readonly pricingTooltip: Locator
  public readonly confirmDialog: Locator
  public readonly submitTagButton: Locator

  constructor(page: Page, wallet: Web3ProviderBackend) {
    this.page = page
    this.wallet = wallet
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
          // Make sure we get a successful response
          return json?.[0]?.result?.data?.json === ''
        }
        return false
      },
      timeout: 20_000, // blockchain transactions can take longer
    })

    const signTransactionButton = this.page.getByRole('button', { name: 'complete purchase' })
    await expect?.(signTransactionButton).toBeEnabled({ timeout: 20_000 }) // blockchain stuff is a bit slow
    await this.page.bringToFront()

    // Check for errors
    const errorButton = this.page.getByRole('button', { name: 'error' })
    expect?.(errorButton).toBeHidden()

    // Wait for loading state to finish
    await this.page
      .getByRole('button', { name: 'loading' })
      .waitFor({ state: 'detached', timeout: 15_000 })

    // Click to confirm
    await signTransactionButton.click()

    // Wait for the request and response
    await confirmTagsRequest
    await confirmTagsResponse

    // Wait for navigation and page to stabilize
    await this.page.waitForURL('/account/sendtag')
    await this.page.waitForLoadState('networkidle')

    // Wait for the confirmed state to be reflected in the UI
    await this.page.waitForSelector('[data-testid^="confirmed-tag-"]', {
      state: 'visible',
      timeout: 10000,
    })
  }

  async addPendingTag(tagName: string) {
    log('add pending tag', tagName)
    await this.page.getByLabel('Tag name').fill(tagName)
    await this.submitTagButton.click()
    await this.page.getByTestId(`pending-tag-${tagName}`).waitFor({ state: 'visible' })
  }
}
