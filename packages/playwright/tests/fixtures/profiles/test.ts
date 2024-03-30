import type { Page, Expect, Locator } from '@playwright/test'

export { test } from '@playwright/test'

export class ProfilePage {
  public sendButton: Locator
  public requestButton: Locator

  constructor(
    public readonly page: Page,
    public readonly profile: { name: string; about: string }
  ) {
    this.sendButton = page.getByTestId('openSendDialogButton')
    this.requestButton = page.getByRole('button', { name: 'Request' })
  }

  async visit(tag: string, expect?: Expect<ProfilePage>) {
    await this.page.goto(`/profile/${tag}`)
    const title = await this.page.title()
    expect?.(title).toBe('Send | Profile')
    await expect?.(this.page.getByRole('heading', { name: tag })).toBeVisible()
    await expect?.(this.page.getByRole('heading', { name: this.profile.name })).toBeVisible()
    await expect?.(this.page.getByText(this.profile.about, { exact: true })).toBeVisible()
    await expect?.(this.page.getByAltText(this.profile.name)).toBeVisible()
  }
}
