import type { Page, Expect, Locator } from '@playwright/test'

export { test } from '@playwright/test'

export class ProfilePage {
  public readonly page: Page
  public readonly profile: { name: string; about: string }
  public sendButton: Locator

  constructor(page: Page, profile: { name: string; about: string }) {
    this.page = page
    this.profile = profile
    this.sendButton = page.getByRole('link', { name: 'SEND', exact: true })
  }

  async visit(tag: string, expect?: Expect) {
    await this.page.goto(`/${tag}`)
    await expect?.(async () => {
      const title = await this.page.title()
      expect?.(title).toBe('Send | Profile')
    }).toPass()
    await expect?.(this.page.locator('#profileName')).toHaveText(this.profile.name)
  }
}
