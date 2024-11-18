import type { Page, Expect, Locator } from '@playwright/test'

export { test } from '@playwright/test'

export class ProfilePage {
  public sendButton: Locator

  constructor(
    public readonly page: Page,
    public readonly profile: { name: string; about: string }
  ) {
    this.sendButton = page.getByRole('link', { name: 'SEND' })
  }

  async visit(tag: string, expect?: Expect) {
    await this.page.goto(`/${tag}`)
    const title = await this.page.title()
    expect?.(title).toBe('Send | Profile')
    await expect?.soft(this.page.getByRole('heading', { name: tag })).toBeVisible()
    await expect?.soft(this.page.locator('#profileName')).toHaveText(this.profile.name)
    await expect?.soft(this.page.getByText(this.profile.about, { exact: true })).toBeVisible()
    // await expect?.soft(this.page.getByAltText(this.profile.name)).toBeVisible()
  }
}
