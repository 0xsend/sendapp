import { assert } from 'app/utils/assert'
import { expect, test } from './fixtures/send-accounts'
import { throwIf } from 'app/utils/throwIf'
import { debug } from 'debug'
import type { Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@my/supabase/database.types'
import type { Authenticator } from '@0xsend/webauthn-authenticator'
import { withRetry } from 'viem'
import { hexToBytea } from 'app/utils/hexToBytea'

let log: debug.Debugger

// navigate to backup page
test.beforeEach(async ({ page, user: { user } }) => {
  log = debug(`test:account:logged-in:${user.id}:${test.info().parallelIndex}`)
  await page.goto('/')
  await page.waitForURL('/')
  await page.getByRole('link', { name: 'account' }).click()
  await page.waitForURL('/account')
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.waitForURL('/account/settings/edit-profile')
  await page.locator('[id="__next"]').getByRole('link', { name: 'Backup' }).click()
  await expect(page).toHaveURL('/account/settings/backup')
})

const backupAccountTest = async ({
  page,
  supabase,
  authenticator,
}: { page: Page; supabase: SupabaseClient<Database>; authenticator: Authenticator }) => {
  const { data: cred, error } = await supabase.from('webauthn_credentials').select('*').single()
  expect(error).toBeFalsy()
  assert(!!cred, 'cred not found')

  expect(cred).toBeTruthy()
  expect(page.getByText(cred.display_name)).toBeVisible()

  await page.getByRole('link', { name: 'Add Passkey' }).click()
  await page.waitForURL('/account/settings/backup/create')

  const acctName = `test-${Math.floor(Math.random() * 1000000)}`
  await page.getByRole('textbox', { name: 'Passkey name' }).fill(acctName)
  await expect(page.getByLabel('Passkey name')).toHaveValue(acctName)
  const request = page.waitForRequest('**/rest/v1/rpc/send_accounts_add_webauthn_credential')
  const response = page.waitForResponse('**/rest/v1/rpc/send_accounts_add_webauthn_credential')
  await page.getByRole('button', { name: 'Create Passkey' }).click()
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

  return { sendAcct, webAuthnCred }
}

test('can backup account', async ({ page, supabase, authenticator }) => {
  await backupAccountTest({ page, supabase, authenticator })
})

test('can remove a signer', async ({ page, supabase, authenticator }) => {
  const { sendAcct, webAuthnCred } = await backupAccountTest({ page, supabase, authenticator })
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
  await expect.soft(removeBtn).toBeHidden() // page navigates after successful mutation
  await expect.soft(page.getByTestId('RemovePasskeyButton')).toBeHidden() // page navigates after successful mutation
  await expect(page.getByTestId('RemovePasskeyError')).toBeHidden() // no err

  // retry until signing key is removed from the account
  await withRetry(
    async () => {
      const { data: keyRemoved, error: keyRemovedErr } = await supabase
        .from('send_account_signing_key_removed')
        .select('account, key_slot')
        .eq('account', hexToBytea(sendAcct.address))
        .order('block_num, tx_idx, log_idx, abi_idx')

      if (keyRemovedErr) {
        throw keyRemovedErr
      }

      if (keyRemoved.length === 0) {
        throw new Error('No key removed')
      }

      return keyRemoved
    },
    {
      retryCount: 10,
      delay: 500,
    }
  )

  await expect(page.getByText(webAuthnCred.display_name)).toBeHidden()
})
