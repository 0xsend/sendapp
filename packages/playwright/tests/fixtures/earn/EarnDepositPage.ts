import type { Database } from '@my/supabase/database.types'
import type { Locator, Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, coinToParam } from '.'
import { assert } from 'app/utils/assert'

/**
 * Page object for the earn deposit page
 */

export class EarnDepositPage {
  public readonly startEarningButton: Locator
  public readonly amountInput: Locator
  public readonly termsCheckbox: Locator
  public readonly submitButton: Locator

  constructor(public page: Page) {
    this.startEarningButton = this.page.getByRole('button', { name: 'Start Earning' })
    this.amountInput = this.page.getByPlaceholder('0')
    this.termsCheckbox = this.page.getByTestId('DepositForm').getByRole('checkbox')
    this.submitButton = this.page.getByRole('button', { name: 'Confirm Deposit' })
  }

  async navigate(coin: { symbol: string }) {
    await this.page.goto('/')
    await this.page.getByRole('link', { name: 'Invest', exact: true }).click()
    await this.page.waitForURL('/invest')
    await this.page.getByRole('link', { name: 'Send Earn' }).click()
    await this.page.waitForURL('/earn')
    await expect(this.startEarningButton).toBeVisible()
    await this.startEarningButton.click()
    await this.page.waitForURL(this.depositUrl(coin))
    await expect(this.page.getByText('Start Earning', { exact: true })).toBeVisible()
    await expect(this.amountInput).toBeVisible()
    await expect(this.termsCheckbox).toBeVisible()
    await expect(this.submitButton).toBeVisible({ timeout: 10000 }) // sometimes needs some time to load
  }

  depositUrl(coin: { symbol: string }) {
    return `/earn/${coinToParam(coin)}/deposit`
  }

  async goto(coin: { symbol: string }) {
    await this.page.goto(this.depositUrl(coin))
    await this.page.waitForURL(this.depositUrl(coin))
  }

  async fillAmount(amount: string) {
    await expect(async () => {
      await this.amountInput.fill(amount)
    }).toPass({
      timeout: 5000,
    })
  }

  async acceptTerms() {
    if (await this.termsCheckbox.isVisible()) {
      await expect(async () => {
        await this.termsCheckbox.check()
        expect(await this.termsCheckbox.isChecked()).toBeTruthy()
      }).toPass({
        timeout: 5000,
      })
    }
  }

  async submit() {
    await expect(this.page.getByRole('button', { name: 'Confirm Deposit' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Confirm Deposit' })).toBeEnabled()
    await this.page.getByRole('button', { name: 'Confirm Deposit' }).click()
    await expect(this.page.getByText('Deposit Submitted', { exact: true })).toBeVisible({
      timeout: 10000,
    })
  }

  /**
   * Deposits the given amount of USDC into SendEarn. Assumes the deposit page is already open.
   * @param coin - The coin to deposit
   * @supabase - The Supabase client instance for database interactions
   * @param amount - The amount of USDC to deposit in the decimal format (e.g. 1.23)
   * @returns The deposit record
   */
  async deposit({
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
    owner: `\\x${string}` // Note: RLS filters by user, owner here is the contract owner of the deposit event
    shares: string
    assets: string
    log_addr: `\\x${string}`
  }> {
    // Get the latest block number before making the deposit
    const { data: lastDeposit, error: lastDepositError } = await supabase
      .from('send_earn_deposit')
      .select('block_num')
      .order('block_num', { ascending: false })
      .limit(1)
      .maybeSingle()

    expect(lastDepositError).toBeFalsy()
    const lastBlockNum = lastDeposit?.block_num ?? 0

    await this.fillAmount(amount)
    await expect(async () => {
      if (await this.termsCheckbox.isVisible()) {
        await this.acceptTerms()
      }
    }).toPass({
      timeout: 10000,
    })
    await this.submit()
    await this.page.waitForURL(`/earn/${coinToParam(coin)}/balance`)

    // Initialize deposit variable, explicitly allowing undefined
    let deposit:
      | { owner: `\\x${string}`; shares: string; assets: string; log_addr: `\\x${string}` }
      | undefined

    // Wait and retry a few times as there might be a delay in the deposit being recorded
    await expect
      .poll(
        async () => {
          const { data, error } = await supabase
            .from('send_earn_deposit')
            .select('log_addr, owner, shares::text, assets::text')
            .gt('block_num', lastBlockNum) // Filter for blocks newer than the last known one
            .order('block_num', { ascending: true }) // Get the first new one
            .limit(1)
            .single()

          if (error) {
            return false
          }

          deposit = data
          return true
        },
        {
          timeout: 15000,
          message: `Expected to find a new send_earn_deposit record after block ${lastBlockNum} in Supabase`,
        }
      )
      .toBeTruthy()

    assert(
      !!deposit,
      `Deposit record was not found after polling, despite expect.poll succeeding. Block: ${lastBlockNum}`
    )

    return deposit
  }
}
