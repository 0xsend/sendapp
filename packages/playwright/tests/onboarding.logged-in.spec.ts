/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { testBaseClient } from './fixtures/viem/base'
import { test, expect } from './fixtures/auth'
import { Hex, parseEther } from 'viem'
import { assert } from 'app/utils/assert'
import debug from 'debug'

test('can visit onboarding page', async ({ page, credentialsStore }) => {
  await page.goto('/onboarding')
  expect(page).toHaveURL('/onboarding')
  await page.getByRole('button', { name: 'Create' }).click()

  // assert passkey was created
  expect(Object.values(credentialsStore).length).toBe(1)
  const credential = Object.values(credentialsStore)[0]

  assert(!!credential, 'Missing credential')

  expect(credential.attestations.length).toBe(1)
  const attestation = credential.attestations[0]

  assert(!!attestation, 'Missing credential attestation')

  const { clientDataJSON, attestationObject } = attestation

  assert(!!clientDataJSON && !!attestationObject, 'Missing clientDataJSON or attestationObject')

  const addrLocator = page.getByLabel('Your sender address:')
  await expect(addrLocator).toHaveValue(/^0x[a-f0-9]{40}$/i)
  const address = await addrLocator.inputValue()

  // sponsor the creation by setting the balance using anvil
  await testBaseClient.setBalance({
    address: address as Hex,
    value: parseEther('1'),
  })

  await expect(page.getByLabel('Your userOp Hash:')).toHaveValue(/^0x[a-f0-9]{64}$/i)

  await page.getByRole('button', { name: 'Sign' }).click()

  // verify assertion
  const assertion = credential.assertions[0]
  assert(!!assertion, 'Missing credential assertion')

  const signResult = page.getByLabel('Sign result:')
  await expect(signResult).toHaveValue(/^0x[a-f0-9]+$/i)

  // send user op
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByLabel('Send result:')).toHaveValue('true')
})
