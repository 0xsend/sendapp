import { faker } from '@faker-js/faker'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { devices, mergeTests, type Page } from '@playwright/test'
import { pricing } from 'app/data/sendtags'
import debug from 'debug'
import { getAuthSessionFromContext } from './fixtures/auth'
import { type AddSendtagsPage, expect, test as addSendtagsTest } from './fixtures/sendtags/add'

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
  const tagNames = Array.from({ length: 5 }, () => ({
    name: `${faker.lorem.word()}_${test.info().parallelIndex}`,
  }))
  await supabase
    .from('tags')
    .insert(tagNames)
    .then(({ error }) => {
      expect(error).toBeFalsy()
    })
  addSendtagsPage.page.reload()
  for (const { name } of tagNames) {
    await expect(addSendtagsPage.page.getByTestId(`pending-tag-${name}`)).toBeVisible()
  }
  await expect(addSendtagsPage.submitTagButton).toBeHidden()
  const { error } = await supabase.from('tags').insert({ name: faker.lorem.word() })
  expect(error).toBeTruthy()
  expect(error?.message).toBe('User can have at most 5 tags')
  expect(error?.code).toBe('P0001')
})

test('cannot confirm a tag without paying', async ({ addSendtagsPage, supabase }) => {
  const tagName = `${faker.lorem.word()}_${test.info().parallelIndex}`
  await addPendingTag(addSendtagsPage, tagName)
  await addSendtagsPage.page.pause()
  const { data, error } = await supabase.rpc('confirm_tags', {
    tag_names: [tagName],
    event_id: '',
    referral_code_input: '',
  })
  log('cannot confirm a tag without paying', data, error)
  expect(error).toBeTruthy()
  expect(error?.code).toBe('42501')
  expect(error?.message).toBe('permission denied for function confirm_tags')
  expect(data).toBeFalsy()
})
