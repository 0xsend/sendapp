import path from 'path'
import type { Expect, Locator, Page } from '@playwright/test'
import debug from 'debug'
import { Web3ProviderBackend, Web3RequestKind } from 'headless-web3-provider'

const log = debug('test:fixtures:checkout:page')

export class CheckoutPage {
  public readonly pricingDialog: Locator
  public readonly confirmDialog: Locator
  public readonly submitTagButton: Locator
  constructor(
    public readonly page: Page,
    public readonly wallet: Web3ProviderBackend
  ) {
    this.pricingDialog = page.getByLabel('Send Tag Pricing')
    this.confirmDialog = page.getByLabel('Confirming Send Tags')
    this.submitTagButton = page.getByRole('button', { name: 'Add Tag' })
  }

  async goto() {
    log('goto /checkout')
    await this.page.goto('/checkout')
  }

  async fillTagName(tag: string) {
    await this.page.getByPlaceholder('Send Tag name').fill(tag)
  }

  async submitTagName() {
    const request = this.page.waitForRequest((request) => {
      log('submitTagName request', request.url(), request.method(), request.postDataJSON())
      return request.url().includes('/rest/v1/tags') && request.method() === 'POST'
    })
    const response = this.page.waitForEvent('response', async (response) => {
      log('submitTagName response', response.url(), response.status(), await response.text())
      return response.url().includes('/rest/v1/tags')
    })
    await this.submitTagButton.click()
    await request
    await response
  }

  async addPendingTag(tag: string) {
    await this.fillTagName(tag)
    await this.submitTagName()
  }

  async openPricingDialog() {
    await this.page.getByRole('button', { name: 'Pricing' }).click()
    await this.pricingDialog.isVisible()
  }

  async confirmTags(expect: Expect<CheckoutPage>) {
    log('confirmTags')
    const confirmButton = this.page.getByRole('button', { name: 'Confirm' })
    expect?.(confirmButton).toBeEnabled()
    await this.page.bringToFront()
    await confirmButton.click()

    // click connect wallet
    log('click connect wallet')
    const connectButton = this.page.getByRole('button', { name: 'Connect Wallet' })
    expect?.(connectButton).toBeEnabled()
    await this.page.bringToFront()
    await connectButton.click()
    await this.wallet.authorize(Web3RequestKind.RequestAccounts)

    // switch network
    // log('switch network')
    // const switchNetworkButton = this.page.getByRole('button', { name: 'Switch Network' })
    // expect?.(switchNetworkButton).toBeEnabled()
    // await this.page.bringToFront()
    // await switchNetworkButton.click()
    // await this.wallet.authorize(Web3RequestKind.SwitchEthereumChain)

    // sign message to verify address
    log('sign message to verify address')
    const signMessageButton = this.page.getByRole('button', { name: 'Sign Message' })
    const verifyAddressRequest = this.page.waitForRequest((request) => {
      log('verify address request', request.url(), request.method(), request.postDataJSON())
      return request.url().includes('/api/trpc/chainAddress.verify') && request.method() === 'POST'
    })
    const verifyAddressResponse = this.page.waitForEvent('response', async (response) => {
      log('verify address response', response.url(), response.status(), await response.text())
      return response.url().includes('/api/trpc/chainAddress.verify')
    })
    expect?.(signMessageButton).toBeEnabled()
    await this.page.bringToFront()
    await signMessageButton.click()
    await this.wallet.authorize(Web3RequestKind.SignMessage)
    await verifyAddressRequest
    await verifyAddressResponse

    // sign transaction
    log('sign transaction')
    const confirmTagsRequest = this.page.waitForRequest((request) => {
      log('confirmTags request', request.url(), request.method(), request.postDataJSON())
      return request.url().includes('/api/trpc/tag.confirm') && request.method() === 'POST'
    })
    const confirmTagsResponse = this.page.waitForEvent('response', async (response) => {
      const json = await response.json().catch(() => ({}))
      log('confirmTags response', response.url(), response.status(), await response.text())
      return (
        response.url().includes('/api/trpc/tag.confirm') && json?.[0]?.result?.data?.json === ''
      )
    })
    const signTransactionButton = this.page.getByRole('button', { name: 'Sign Transaction' })
    expect?.(signTransactionButton).toBeEnabled()
    await this.page.bringToFront()
    await signTransactionButton.click()
    await this.wallet.authorize(Web3RequestKind.SendTransaction)
    await confirmTagsRequest
    await confirmTagsResponse
    expect?.(this.confirmDialog).toContainText('Send Tags are confirmed.')
    await expect?.(
      this.confirmDialog.getByRole('link', {
        name: 'X Post Referral Link',
      })
    ).toBeVisible()
    await this.confirmDialog.getByLabel('Close').click()
  }

  async waitForConfirmation() {
    await this.page.getByText('Sent transaction...').waitFor({
      state: 'detached',
      timeout: 30_000, // block time is 10s + 2 block confirmations
    })
  }

  async takeScreenshot() {
    const screenshot = path.join(
      'screenshots',
      `./checkout-${Date.now()}-${Math.random() * 100}.png`
    )
    log('takeScreenshot', screenshot)
    await this.page
      .screenshot({
        path: screenshot,
      })
      .catch((e) => {
        log('takeScreenshot failed', e)
      })
  }
}
