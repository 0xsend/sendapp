/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { test, expect } from './fixtures/auth'

test('can visit onboarding page', async ({ page, credentialsStore }) => {
  await page.goto('/onboarding')
  expect(page).toHaveURL('/onboarding')
  await page.getByRole('button', { name: 'Create' }).click()

  // assert passkey was created
  //console.log('credentialsStore', credentialsStore)
  expect(Object.values(credentialsStore).length).toBe(1)
  const credential = Object.values(credentialsStore)[0]

  if (!credential) {
    throw new Error('Missing credential')
  }

  //console.log('credential', credential)

  expect(credential.attestations?.length).toBe(1)
  const attestation = credential.attestations?.[0]

  if (!attestation) {
    throw new Error('Missing credential attestation')
  }
  //console.log('attestation', attestation)

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

  // TODO: check address, userOp, public key

  await page.getByRole('button', { name: 'Sign' }).click()

  // verify assertion
  const assertion = credential.assertions?.[0]
  if (!assertion) {
    throw new Error('Missing credential assertion')
  }

  await expect(page.getByLabel('Sign result:')).toHaveValue('asdf')

  // await page.pause()
})
