import type { Database } from '@my/supabase/database.types'
import type { Locator, Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { coinToParam, expect, navigateToEarnPage } from '.'

/**
 * Page object for the earn withdraw page
 */

export class EarnWithdrawPage {
  public readonly withdrawButton: Locator
  public readonly amountInput: Locator
  public readonly submitButton: Locator

  constructor(public page: Page) {
    this.withdrawButton = this.page.getByRole('link', { name: 'Withdraw' })
    this.amountInput = this.page.getByPlaceholder('0')
    this.submitButton = this.page.getByRole('button', { name: 'Confirm Withdraw' })
  }

  async goto(coin: { symbol: string }) {
    await navigateToEarnPage(this.page)

    // From /earn, navigate to the specific coin's balance page
    await this.page.getByRole('button', { name: 'VIEW DETAILS' }).click()
    await this.page.waitForURL(`/earn/${coinToParam(coin)}`)

    // From the balance page, navigate to the withdraw form
    await expect(this.withdrawButton).toBeVisible()
    await this.withdrawButton.click()
    await this.page.waitForURL(`/earn/${coinToParam(coin)}/withdraw`) // Wait for withdraw form URL

    // Assert elements on the withdraw form page
    await expect(this.page.getByText('Withdraw Amount', { exact: true })).toBeVisible()
    await expect(this.amountInput).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }

  async fillAmount(amount: string) {
    await expect(async () => {
      await this.amountInput.fill(amount)
    }).toPass({
      timeout: 5000,
    })
  }

  async submit() {
    await expect(this.page.getByRole('button', { name: 'Confirm Withdraw' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Confirm Withdraw' })).toBeEnabled()
    await this.page.getByRole('button', { name: 'Confirm Withdraw' }).click()
    await expect(this.page.getByText('Withdrawn successfully', { exact: true })).toBeVisible()
  }

  /**
   * Withdraws the given amount from SendEarn. Assumes the withdraw page is already open.
   * @param coin - The coin to withdraw
   * @supabase - The Supabase client instance for database interactions
   * @param amount - The amount to withdraw in the decimal format (e.g. 1.23)
   * @returns The withdrawal record
   */
  async withdraw({
    coin,
    supabase,
    amount,
  }: {
    coin: {
      symbol: string
    }
    supabase: SupabaseClient<Database>
    amount: string
  }): Promise<{
    owner: `\\x${string}`
    shares: string
    assets: string
    log_addr: `\\x${string}`
  }> {
    await this.fillAmount(amount)
    await this.submit()
    await this.page.waitForURL(`/earn/${coinToParam(coin)}`)

    let withdrawal: {
      owner: `\\x${string}`
      shares: string
      assets: string
      log_addr: `\\x${string}`
    }

    // Wait and retry a few times as there might be a delay in the withdrawal being recorded
    await expect
      .poll(
        async () => {
          const { data, error } = await supabase
            .from('send_earn_activity')
            .select('log_addr, owner, shares::text, assets::text')
            .eq('type', 'withdraw')
            .order('block_time', { ascending: false })
            .limit(1)
            .single()

          if (error) {
            return false
          }

          withdrawal = data
          return true
        },
        {
          timeout: 15000,
          intervals: [1000, 2000, 3000, 5000],
          message: 'Expected to find a withdrawal record in send_earn_activity in Supabase',
        }
      )
      .toBeTruthy()
    // @ts-expect-error - we know withdrawal is not null
    return withdrawal
  }
}
