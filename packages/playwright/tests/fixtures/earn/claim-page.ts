import type { Database } from '@my/supabase/database.types'
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { erc20Coin } from 'app/data/coins'
import type { AffiliateVault } from 'app/features/earn/zod'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import debug from 'debug'
import { coinToParam } from '.'

let log: debug.Debugger

/**
 * Page object for the earn claim rewards page
 */
export class EarnClaimPage {
  public readonly claimButton: Locator
  public readonly availableRewardsText: Locator

  constructor(public page: Page) {
    log = debug(`test:earn:claim:${Math.random().toString(36).substring(7)}`)
    this.claimButton = this.page.getByRole('button', { name: 'Claim Rewards' })
    this.availableRewardsText = this.page.getByTestId('availableRewards')
  }

  async goto(coin: erc20Coin) {
    log('goto /earn/rewards')
    await this.page.goto('/')
    await expect(this.page.getByRole('link', { name: 'Earn', exact: true })).toBeVisible()
    await this.page.getByRole('link', { name: 'Earn', exact: true }).click()
    await this.page.waitForURL('/earn')
    await expect(this.page.getByRole('button', { name: 'VIEW DETAILS' })).toBeVisible()
    await this.page.getByRole('button', { name: 'VIEW DETAILS' }).click()
    await this.page.waitForURL(`/earn/${coinToParam(coin)}`)
    await expect(this.page.getByRole('link', { name: 'Rewards' })).toBeVisible()
    await this.page.getByRole('link', { name: 'Rewards' }).click()
  }

  async getAvailableRewards(): Promise<number> {
    await expect(this.availableRewardsText).toBeVisible()
    const rewardsText = await this.availableRewardsText.textContent()
    log('rewards text')
    // Extract the numeric value from the text (e.g., "Available: 1.23 USDC" -> 1.23)
    const match = rewardsText?.match(/[\d.]+/)
    assert(!!match?.[0], 'No rewards text match found')
    return Number.parseFloat(match[0])
  }

  async claimRewards({
    affiliateVault,
    supabase,
  }: {
    affiliateVault: NonNullable<AffiliateVault>
    supabase: SupabaseClient<Database>
  }): Promise<{
    owner: `\\x${string}`
    assets: string
    shares: string
    log_addr: `\\x${string}`
    type: string
  }> {
    assert(!!affiliateVault.send_earn_affiliate_vault?.send_earn, 'Affiliate vault is not defined')
    log('claiming rewards')
    await expect(this.claimButton).toBeVisible()
    await expect(this.claimButton).toBeEnabled()
    await this.claimButton.click()
    await this.page.getByText('Rewards claimed', { exact: true }).waitFor({ timeout: 10_000 })

    // Wait for the claim to be recorded in the database
    let claim:
      | {
          owner: `\\x${string}`
          assets: string
          shares: string
          log_addr: `\\x${string}`
          type: string
        }
      | undefined

    await expect
      .poll(
        async () => {
          const { data, error } = await supabase
            .from('send_earn_activity')
            .select('owner, assets::text, shares::text, log_addr, type')
            .eq('type', 'deposit')
            .eq('sender', hexToBytea(affiliateVault.send_earn_affiliate))
            .order('block_time', { ascending: false })
            .limit(1)
            .single()

          if (error) {
            log('error fetching claim', error)
            return false
          }

          log('claim data', data)
          claim = data as {
            owner: `\\x${string}`
            assets: string
            shares: string
            log_addr: `\\x${string}`
            type: string
          }
          return true
        },
        {
          timeout: 15000,
          intervals: [1000, 2000, 3000, 5000],
          message: 'Expected to find a claim record in send_earn_activity',
        }
      )
      .toBe(true)
    assert(!!claim, 'Claim is not defined')
    return claim
  }
}
