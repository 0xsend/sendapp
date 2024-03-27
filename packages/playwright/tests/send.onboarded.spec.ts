import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { debug, Debugger } from 'debug'
import { assert } from 'app/utils/assert'
import { userOnboarded } from '@my/snaplet/src/models'
import { ProfilePage } from './fixtures/profiles'

const test = mergeTests(sendAccountTest, snapletTest)

let log: Debugger

test.beforeAll(async () => {
  log = debug(`test:send:logged-in:${test.info().workerIndex}`)
})

test('can send ETH to user on profile', async ({ page, seed }) => {
  test.slow() // Easy way to triple the default timeout
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, {
    name: profile.name,
    about: profile.about,
  })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()

  // @todo create send form fixture
  const sendDialog = page.getByTestId('sendDialogContainer')
  await expect(sendDialog).toBeVisible()
  const amountInput = sendDialog.getByLabel('Amount')
  await expect(amountInput).toBeVisible()
  await amountInput.fill('0.01')
  const sendDialogButton = sendDialog.getByRole('button', { name: 'Send' })
  expect(sendDialogButton).toBeVisible()
  await sendDialogButton.click()
  await expect(sendDialog.getByText(/Sent user op [0-9a-f]+/).first()).toBeVisible({
    timeout: 20000,
  })
  await expect(sendDialog.getByRole('button', { name: 'View on Otterscan' })).toBeVisible()
})

test('can send USDC to user on profile', async ({ page, seed }) => {
  test.slow() // Easy way to triple the default timeout
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, {
    name: profile.name,
    about: profile.about,
  })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()

  // @todo create send form fixture
  const sendDialog = page.getByTestId('sendDialogContainer')
  await expect(sendDialog).toBeVisible()
  const amountInput = sendDialog.getByLabel('Amount')
  await expect(amountInput).toBeVisible()
  await amountInput.fill('5')
  const tokenSelect = sendDialog.getByRole('combobox') // @todo when tamagui supports this , { name: 'Token' })
  await expect(tokenSelect).toBeVisible()
  await tokenSelect.selectOption('USDC')
  const sendDialogButton = sendDialog.getByRole('button', { name: 'Send' })
  expect(sendDialogButton).toBeVisible()
  await sendDialogButton.click()
  await expect(sendDialog.getByText(/Sent user op [0-9a-f]+/).first()).toBeVisible({
    timeout: 20000,
  })
  await expect(sendDialog.getByRole('button', { name: 'View on Otterscan' })).toBeVisible()
})
