/**
 * Onboarding tests for Send app users targeting web.
 *
 * Currently, Playwright browsers do no support WebAuthn, so we mock the call to the WebAuthn API.
 */

import { expect, test } from './fixtures/auth'
import { OnboardingPage, expect as expectOnboarding } from './fixtures/send-accounts'

test('can visit onboarding page', async ({ page, supabase, authenticator }) => {
  const onboardingPage = new OnboardingPage(page)
  await onboardingPage.completeOnboarding(expect)
  await expectOnboarding(supabase).toHaveValidWebAuthnCredentials(authenticator)
})
