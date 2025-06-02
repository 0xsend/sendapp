import { faker } from '@faker-js/faker'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { devices, mergeTests, type Page } from '@playwright/test'
import { pricing } from 'app/data/sendtags'
import debug from 'debug'
import { getAuthSessionFromContext } from './fixtures/auth'
import { type AddSendtagsPage, expect, test as addSendtagsTest } from './fixtures/sendtags/add'
import { assert } from 'app/utils/assert'

let log: debug.Debugger

const test = mergeTests(addSendtagsTest, snapletTest)

const debugAuthSession = async (page: Page) => {
  const { decoded } = await getAuthSessionFromContext(page.context())
  log('user authenticated', `id=${decoded.sub}`, `session=${decoded.session_id}`)
}

const pricingText = pricing.flatMap((p) => [p.length, p.price])

test.beforeEach(async ({ addSendtagsPage }) => {
  log = debug(`test:account-sendtag-add:logged-in:${test.info().parallelIndex}`)
  log('beforeEach', `url=${addSendtagsPage.page.url()}`)
  await debugAuthSession(addSendtagsPage.page)
})

const checkPricingTooltip = async (addSendtagsPage: AddSendtagsPage) => {
  await addSendtagsPage.openPricingTooltip()
  await expect(addSendtagsPage.pricingTooltip).toBeVisible()
  for (const text of pricingText) {
    await expect(addSendtagsPage.pricingTooltip).toContainText(text)
  }
}

const checkPricingDialog = async (addSendtagsPage: AddSendtagsPage) => {
  await addSendtagsPage.page.setViewportSize(devices['Pixel 5'].viewport)
  await addSendtagsPage.openPricingDialog()
  for (const text of pricingText) {
    await expect(addSendtagsPage.pricingDialog).toContainText(text)
  }
  await addSendtagsPage.pricingDialog.getByLabel('Dialog Close').click()
  await expect(addSendtagsPage.pricingDialog).toBeHidden()
}

const addPendingTag = async (addSendtagsPage: AddSendtagsPage, tagName: string) => {
  await addSendtagsPage.addPendingTag(tagName)
  await expect(addSendtagsPage.page.getByTestId(`pending-tag-${tagName}`)).toBeVisible()
}

// tag names are limited to 1-20 characters
const generateTagName = () => faker.string.alphanumeric({ length: { min: 6, max: 20 } })

test('can visit add sendtags page', async ({ addSendtagsPage }) => {
  await checkPricingTooltip(addSendtagsPage)
  await checkPricingDialog(addSendtagsPage)
})

test('can add a pending tag', async ({ addSendtagsPage }) => {
  const tagName = generateTagName()
  await addPendingTag(addSendtagsPage, tagName)
})

test('cannot add an invalid tag name', async ({ addSendtagsPage }) => {
  await addSendtagsPage.fillTagName('invalid tag!')
  await addSendtagsPage.submitTagButton.click()
  expect(
    addSendtagsPage.page.getByText('Only English alphabet, numbers, and underscore')
  ).toBeTruthy()
})

test('cannot add more than 5 tags', async ({ addSendtagsPage, supabase }) => {
  // counting 1st free tag registered during onboarding
  const tagNames = Array.from({ length: 4 }, () => ({
    name: `${faker.lorem.word()}_${test.info().parallelIndex}`,
  }))

  // Get the user's send account first
  const { data: sendAccount } = await supabase.from('send_accounts').select('id').single()

  expect(sendAccount).toBeTruthy()
  assert(!!sendAccount?.id, 'Send account id should be defined')

  // Create tags using RPC for each tag
  for (const { name } of tagNames) {
    const { error } = await supabase.rpc('create_tag', {
      tag_name: name,
      send_account_id: sendAccount?.id,
    })
    expect(error).toBeFalsy()
  }

  // Reload page to see the tags
  await addSendtagsPage.page.reload()

  // Verify all tags are visible
  for (const { name } of tagNames) {
    await expect(addSendtagsPage.page.getByTestId(`pending-tag-${name}`)).toBeVisible()
  }

  // Verify the submit button is hidden when max tags reached
  await expect(addSendtagsPage.submitTagButton).toBeHidden()

  // Try to create one more tag via RPC - should fail
  const { error } = await supabase.rpc('create_tag', {
    tag_name: faker.lorem.word(),
    send_account_id: sendAccount?.id,
  })

  // Verify the error
  expect(error).toBeTruthy()
  expect(error?.message).toBe('User can have at most 5 tags')
  expect(error?.code).toBe('P0001')
})

test('cannot confirm a tag without paying', async ({ addSendtagsPage, supabase }) => {
  const tagName = `${faker.lorem.word()}_${test.info().parallelIndex}`
  await addPendingTag(addSendtagsPage, tagName)

  const { error } = await supabase.rpc('confirm_tags', {
    tag_names: [tagName],
    _event_id: '',
    _referral_code: '',
    send_account_id: '123',
  })

  log('cannot confirm a tag without paying', { tagName }, error)
  expect(error).toBeTruthy()
  expect(error?.code).toBe('42501')
  expect(error?.message).toBe('permission denied for function confirm_tags')
})
