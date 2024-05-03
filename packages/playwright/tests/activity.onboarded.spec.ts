/**
 * Activity page is primiarly used for logged in users to find recent activity and also to search for users.
 */

import { SUPABASE_URL } from 'app/utils/supabase/admin'
import { expect, test } from './fixtures/send-accounts'
import debug from 'debug'
import type { Page } from '@playwright/test'

let log: debug.Debugger

test.beforeEach(() => {
  log = debug(`test:activity:logged-in:${test.info().parallelIndex}`)
})

const activityHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Activity', exact: true }).and(page.getByText('Activity'))

test('can visit activity page', async ({ page }) => {
  await page.goto('/activity')
  log('beforeEach', `url=${page.url()}`)
  await expect(activityHeading(page)).toBeVisible()
})

test('can search on activity page', async ({ page, context }) => {
  await page.goto('/activity')
  log('beforeEach', `url=${page.url()}`)
  const testTags = ['dob_spud89665', 'down_coke9222', 'few_down65006']

  // TODO: use snaplet snapshots so no need to mock supabase
  await context.route(`${SUPABASE_URL}/rest/v1/rpc/tag_search*`, async (route) => {
    expect(route.request().postDataJSON().query).toBe('test')
    await route.fulfill({
      body: JSON.stringify([
        {
          send_id_matches: null,
          tag_matches: testTags.map((t) => ({
            avatar_url: null,
            tag_name: t,
            send_id: 3665,
            phone: null,
          })),
          phone_matches: null,
        },
      ]),
      headers: { 'content-type': 'application/json; charset=utf-8' },
      status: 200,
    })
  })

  await expect(activityHeading(page)).toBeVisible()
  const isLoading = page.getByRole('progressbar', { name: 'Loading' })
  await page.getByRole('textbox', { name: 'Name, $Sendtag, Phone, Email' }).fill('test')
  await expect(page.getByRole('textbox', { name: 'Name, $Sendtag, Phone, Email' })).toHaveValue(
    'test'
  )
  await isLoading.waitFor({ state: 'detached' })
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible()
  for (const tag of testTags) {
    await expect(page.getByText(tag)).toBeVisible()
  }
})
