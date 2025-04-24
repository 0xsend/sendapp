import type { Authenticator } from '@0xsend/webauthn-authenticator'
import type { Database, Tables } from '@my/supabase/database.types'
import type { Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assert } from 'app/utils/assert'
import { byteaToBytes } from 'app/utils/byteaToBytes'
import { hexToBytea } from 'app/utils/hexToBytea'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { throwIf } from 'app/utils/throwIf'
import debug from 'debug'
import { withRetry } from 'viem'
import { expect, test } from './fixtures/send-accounts'

let log: debug.Debugger

// navigate to backup page
test.beforeEach(async ({ page, user: { user } }) => {
  log = debug(`test:account:logged-in:${user.id}:${test.info().parallelIndex}`)
  const nextContainer = page.locator('[id="__next"]')
  await page.goto('/')
  await page.waitForURL('/')
  const accountLink = page.getByRole('link', { name: 'Account' })
  expect(accountLink).toBeVisible()
  await accountLink.click()
  await page.waitForURL('/account')
  await nextContainer.getByRole('link', { name: 'Settings' }).click()
  await page.waitForURL('/account/settings')
  await nextContainer.getByRole('link', { name: 'Passkeys' }).click()
  await expect(page).toHaveURL('/account/settings/backup')
})

const backupAccountTest = async ({
  page,
  supabase,
  authenticator,
  profile,
}: {
  page: Page
  supabase: SupabaseClient<Database>
  authenticator: Authenticator
  profile: Tables<'profiles'>
}) => {
  const { data: cred, error } = await supabase.from('webauthn_credentials').select('*').single()
  expect(error).toBeFalsy()
  assert(!!cred, 'cred not found')

  expect(cred).toBeTruthy()
  expect(page.getByText(cred.display_name)).toBeVisible()

  await page.getByRole('link', { name: 'add a passkey' }).click()
  await page.waitForURL('/account/settings/backup/create')

  const acctName = `test-${Math.floor(Math.random() * 1000000)}`
  await page.getByRole('textbox', { name: 'Passkey name' }).fill(acctName)
  await expect(page.getByLabel('Passkey name')).toHaveValue(acctName)
  const request = page.waitForRequest('**/rest/v1/rpc/send_accounts_add_webauthn_credential')
  const response = page.waitForResponse('**/rest/v1/rpc/send_accounts_add_webauthn_credential')
  await page.getByRole('button', { name: 'add a passkey' }).click()
  await request
  await response

  // validate send account is created
  const { data: sendAcct, error: sendAcctErr } = await supabase
    .from('send_accounts')
    .select('*, send_account_credentials(*), webauthn_credentials(*)')
    .order('created_at', { referencedTable: 'webauthn_credentials' })
    .single()
  throwIf(sendAcctErr)
  assert(!!sendAcct, 'No send account found')
  const acctCred = sendAcct.send_account_credentials[1]
  assert(!!acctCred, 'Missing account credential')
  const webAuthnCred = sendAcct.webauthn_credentials[1]
  assert(!!webAuthnCred, 'Missing webauthn credential')

  await page.waitForURL(`/account/settings/backup/confirm/${webAuthnCred.id}`)
  const bundlerReq = page.waitForRequest('**/rpc')
  const bundlerRes = page.waitForResponse('**/rpc')
  const confirmBtn = page.getByRole('button', { name: 'Add Passkey as Signer' })
  await confirmBtn.click()
  await bundlerReq
  await bundlerRes // wait for bundler response
  await expect.soft(confirmBtn).toBeHidden() // page navigates after successful mutation
  await expect(page.getByText('Something went wrong: Error:')).toBeHidden() // no error
  await page.waitForURL('/account/settings/backup') // yay, we're back on the page

  await expect(supabase).toHaveValidWebAuthnCredentials(authenticator)

  const [xHex, yHex] = COSEECDHAtoXY(byteaToBytes(webAuthnCred.public_key))
  const xPgB16 = hexToBytea(xHex)
  const yPgB16 = hexToBytea(yHex)

  await expect(supabase).toHaveEventInActivityFeed({
    event_name: 'send_account_signing_key_added',
    from_user: {
      id: profile.id,
      send_id: profile.send_id,
    },
    data: {
      account: hexToBytea(sendAcct.address).toLowerCase(),
      key_slot: acctCred.key_slot,
      key: [xPgB16, yPgB16],
    },
  })

  return { sendAcct, webAuthnCred }
}

test('can backup account', async ({ page, supabase, authenticator, user: { profile } }) => {
  await backupAccountTest({ page, supabase, authenticator, profile })
})

test('can remove a signer', async ({ page, supabase, authenticator, user: { profile } }) => {
  const { sendAcct, webAuthnCred } = await backupAccountTest({
    page,
    supabase,
    authenticator,
    profile,
  })
  await page
    .locator('div')
    .filter({ hasText: new RegExp(`^${webAuthnCred.display_name}$`) })
    .getByRole('button')
    .click()
  await page.getByRole('button', { name: 'REMOVE PASSKEY' }).click()
  await page.getByRole('textbox').fill(webAuthnCred.display_name)

  const bundlerReq = page.waitForRequest('**/rpc')
  const bundlerRes = page.waitForResponse('**/rpc')
  const removeBtn = page.getByRole('button', { name: 'REMOVE' })
  await removeBtn.click()
  await bundlerReq
  await bundlerRes // wait for bundler response

  await expect(async () => {
    await expect.soft(removeBtn).toBeHidden() // page navigates after successful mutation
    await expect.soft(page.getByTestId('RemovePasskeyButton')).toBeHidden() // page navigates after successful mutation
    await expect(page.getByTestId('RemovePasskeyError')).toBeHidden() // no err
  }).toPass({
    timeout: 10_000,
  })

  // retry until signing key is removed from the account
  const keyRemoved = await withRetry(
    async () => {
      const { data: keyRemoved, error: keyRemovedErr } = await supabase
        .from('send_account_signing_key_removed')
        .select('account, key_slot, key')
        .eq('account', hexToBytea(sendAcct.address))
        .order('block_num, tx_idx, log_idx, abi_idx')

      if (keyRemovedErr) {
        throw keyRemovedErr
      }

      if (keyRemoved.length === 0) throw new Error('No key removed')

      return keyRemoved
    },
    {
      retryCount: 10,
      delay: 500,
    }
  )

  await expect(supabase).toHaveEventInActivityFeed({
    event_name: 'send_account_signing_key_removed',
    from_user: {
      id: profile.id,
      send_id: profile.send_id,
    },
    // biome-ignore lint/suspicious/noExplicitAny: need to define the event schema
    data: keyRemoved.reduce((acc: Record<string, any>, keyRemoved) => {
      const { account, key_slot, key } = keyRemoved
      acc.key = acc.key || []
      return { account, key_slot, key: [...acc.key, key] }
    }, {}),
  })

  await expect(page.getByText(webAuthnCred.display_name)).toBeHidden()
})
