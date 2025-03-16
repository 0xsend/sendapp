import { expect, type Page } from '@playwright/test'

/**
 * Checks if the referral code is visible and applied correctly
 */
export async function checkReferralCodeVisibility({
  page,
  referralCode,
}: { page: Page; referralCode: string }) {
  const refcodeInput = page.getByTestId('referral-code-input')
  const referralCodeConfirmation = page.getByText('Referral code applied')

  await expect(refcodeInput).toBeVisible()
  await expect(refcodeInput).toHaveValue(referralCode)
  await expect(referralCodeConfirmation).toBeVisible()
}

/**
 * Checks if the referral code is hidden
 */
export async function checkReferralCodeHidden(page: Page) {
  const refcode = page.getByTestId('referral-code-input')
  const referralCodeConfirmation = page.getByText('Referral code applied')
  await expect(refcode).toBeHidden()
  await expect(referralCodeConfirmation).toBeHidden()
}
