import { test } from '@my/playwright/fixtures/snaplet'
import { userOnboarded } from '@my/snaplet/models'
import { expect, type Page } from '@playwright/test'
import { assert } from 'app/utils/assert'
import { ProfilePage } from './fixtures/profiles'

const visitProfile = async ({ page, tag }: { page: Page; tag: string }) => page.goto(`/${tag}`)

test('anon user can visit public profile', async ({ page, seed, pg }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const account = plan.send_accounts[0]
  assert(!!tag, 'tag not found')

  // Manually create the send_account_tag
  await pg.query(
    `
    INSERT INTO send_account_tags (tag_id, send_account_id)
    VALUES ($1, $2)
  `,
    [tag.id, account.id]
  )

  const profile = plan.profiles[0]
  assert(!!profile, 'profile not found')
  assert(!!profile.name, 'profile name not found')
  assert(!!profile.about, 'profile about not found')

  await visitProfile({ page, tag: tag.name })
  const title = await page.title()
  expect(title).toBe('Send | Profile')
  await expect(page.locator('#profileName')).toHaveText(profile.name)
  const profilePage = new ProfilePage(page, { name: profile.name, about: profile.about })
  await expect(profilePage.sendButton).toBeVisible()
})

test('anon user cannot visit private profile', async ({ page, seed, pg }) => {
  const plan = await seed.users([
    {
      ...userOnboarded,
      profiles: [{ is_public: false }],
    },
  ])
  const tag = plan.tags[0]
  const account = plan.send_accounts[0]
  assert(!!tag, 'tag not found')

  // Manually create the send_account_tag
  await pg.query(
    `
    INSERT INTO send_account_tags (tag_id, send_account_id)
    VALUES ($1, $2)
  `,
    [tag.id, account.id]
  )

  // Also ensure send_account is active
  await pg.query(
    `
    UPDATE send_accounts 
    SET deleted_at = NULL, init_code = 'a'
    WHERE id = $1
  `,
    [account.id]
  )

  await visitProfile({ page, tag: tag.name })
  const title = await page.title()
  expect(title).toBe('404 | Send')
  await expect(page.getByRole('heading', { name: 'Not found.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Need to sign in?' })).toBeVisible()
})
