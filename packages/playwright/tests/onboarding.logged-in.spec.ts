/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { Attestation } from '@0xsend/webauthn-authenticator/types'
import { test, expect } from './fixtures/auth'
import cbor from 'cbor'

// TODO: add a detereministic seed for the credential store
test('can visit onboarding page', async ({ page, credentialsStore }) => {
  await page.goto('/onboarding')
  expect(page).toHaveURL('/onboarding')
  await page.getByRole('button', { name: 'Create' }).click()

  // assert passkey was created
  expect(Object.values(credentialsStore).length).toBe(1)
  const credential = Object.values(credentialsStore)[0]

  if (!credential) {
    throw new Error('Missing credential')
  }

  console.log('credential', credential)

  expect(credential.attestations?.length).toBe(1)
  const attestation = credential.attestations?.[0]

  if (!attestation) {
    throw new Error('Missing credential attestation')
  }

  const { clientDataJSON, attestationObject } = attestation

  if (!clientDataJSON || !attestationObject) {
    throw new Error('Missing clientDataJSON or attestationObject')
  }

  await expect(page.getByLabel('Create result:')).toHaveValue(
    JSON.stringify(
      {
        rawClientDataJSONB64: Buffer.from(clientDataJSON).toString('base64'),
        rawAttestationObjectB64: Buffer.from(attestationObject).toString('base64'),
      },
      null,
      2
    )
  )

  await expect(page.getByLabel('Your userOp Hash:')).toHaveValue(/^0x[a-f0-9]{64}$/)

  // TODO: check address, userOp, public key

  await page.getByRole('button', { name: 'Sign' }).click()

  // verify assertion
  const assertion = credential.assertions?.[0]
  if (!assertion) {
    throw new Error('Missing credential assertion')
  }

  const signResult = page.getByLabel('Sign result:')
  await expect(signResult).toHaveValue(/^0x[a-f0-9]+$/)

  // send user op
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByLabel('Send result:')).toHaveValue('true')
})
