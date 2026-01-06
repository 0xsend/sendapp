import type { Page, Expect, Locator } from '@playwright/test'

export { test } from '@playwright/test'

export class ProfilePage {
  public readonly page: Page
  public readonly profile: { name: string; about: string }
  public sendButton: Locator

  constructor(page: Page, profile: { name: string; about: string }) {
    this.page = page
    this.profile = profile
    this.sendButton = page.getByTestId('profileSendButton')
  }

  async visit(tag: string, expect?: Expect) {
    await this.page.goto(`/${tag}`)
    await expect?.(async () => {
      const title = await this.page.title()
      expect?.(title).toBe(`localhost/${tag}`)
    }).toPass()
    // Wait for profile to load (spinner to disappear) before checking profileName
    await expect?.(this.page.getByTestId('profileName')).toHaveText(this.profile.name, {
      timeout: 15000,
    })
  }
}
