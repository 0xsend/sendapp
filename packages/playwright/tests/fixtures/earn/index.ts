import { test as sendAccountTest } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import type { Database } from '@my/supabase/database.types'
import { type Locator, mergeTests, type Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { coinToParam } from 'app/features/earn/params'
import debug from 'debug'

const baseTest = mergeTests(sendAccountTest, snapletTest)

let log: debug.Debugger

export const test = baseTest.extend<{
  earnDepositPage: EarnDepositPage
}>({
  earnDepositPage: async ({ page }, use) => {
    log = debug(`test:earn:deposit:${test.info().parallelIndex}`)
    log('creating sendEarnDepositPage')
    const sendEarnDepositPage = new EarnDepositPage(page)
    await use(sendEarnDepositPage)
  },
})

export const expect = test.expect

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

  async goto(coin: { symbol: string }) {
    log('goto /earn')
    await this.page.goto('/')
    await this.page.getByRole('link', { name: 'Earn', exact: true }).click()
    await this.page.waitForURL('/earn')
    await expect(this.startEarningButton).toBeVisible()
    await this.startEarningButton.click()
    await this.page.waitForURL(`/earn/${coinToParam(coin)}/deposit`)
    await expect(this.page.getByText('Start Earning', { exact: true })).toBeVisible()
    await expect(this.amountInput).toBeVisible()
    await expect(this.termsCheckbox).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }

  async fillAmount(amount: string) {
    await expect(async () => {
      await this.amountInput.fill(amount)
    }).toPass({
      timeout: 5_000,
    })
  }

  async acceptTerms() {
    await expect(async () => {
      await this.termsCheckbox.check()
      expect(await this.termsCheckbox.isChecked()).toBeTruthy()
    }).toPass({
      timeout: 5_000,
    })
  }

  async submit() {
    await expect(async () => {
      await this.page.getByRole('button', { name: 'Confirm Deposit' }).click()
      await expect(this.page.getByText('Deposited successfully', { exact: true })).toBeVisible()
    }).toPass({
      timeout: 15_000,
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
    owner: `\\x${string}`
    shares: string
    assets: string
    log_addr: `\\x${string}`
  }> {
    log('depositing', amount, coin.symbol)

    await this.fillAmount(amount)
    await this.acceptTerms()
    await this.submit()
    await this.page.waitForURL(`/earn/${coinToParam(coin)}`)

    let deposit: { owner: `\\x${string}`; shares: string; assets: string; log_addr: `\\x${string}` }

    // Wait and retry a few times as there might be a delay in the deposit being recorded
    await expect
      .poll(
        async () => {
          const { data, error } = await supabase
            .from('send_earn_deposits')
            .select('log_addr, owner, shares::text, assets::text')
            .order('block_num', { ascending: false })
            .single()

          if (error) {
            log('error fetching send_earn_deposits', error)
            return false
          }

          log('send_earn_deposits query result', data)
          deposit = data
          return true
        },
        {
          timeout: 15000,
          intervals: [1000, 2000, 3000, 5000],
          message: 'Expected to find a send_earn_deposits record in Supabase',
        }
      )
      .toBeTruthy()
    // @ts-expect-error - we know deposit is not null
    return deposit
  }
}
