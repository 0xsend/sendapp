import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import debug from 'debug'

const log = debug('api:routers:canton')

/**
 * Canton router - handles Canton Network balance operations
 * Note: Canton price/chart data now comes from CoinGecko (ID: canton-network)
 */
export const cantonRouter = createTRPCRouter({
  /**
   * Get the authenticated user's Canton wallet balance (PROTECTED)
   * Fetches from Canton Wallet API using the canton_wallet_address from their profile
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Fetch user's Canton wallet address from their profile
    const supabase = createSupabaseAdminClient()
    const { data: verification, error } = await supabase
      .from('canton_party_verifications')
      .select('canton_wallet_address')
      .eq('user_id', userId)
      .single()

    if (error || !verification?.canton_wallet_address) {
      // User doesn't have a Canton wallet address verified
      return null
    }

    const partyId = verification.canton_wallet_address

    try {
      const cfAccountId = process.env.CANTON_CF_ACCOUNT_ID
      const cfApiToken = process.env.CANTON_CF_API_TOKEN

      if (!cfAccountId || !cfApiToken) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Canton API credentials not configured',
        })
      }

      // Fetch CC (Amulet) balance from Canton Wallet API
      const url = new URL('https://qapi-mainnet.cantonwallet.com/cantonwallet_balances')
      url.searchParams.set('party_hint', `eq.${partyId}`)
      url.searchParams.set('instrument_id', 'eq.Amulet')

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'cf-account-id': cfAccountId,
          'cf-api-token': cfApiToken,
        },
      })

      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Canton Wallet API returned ${response.status}`,
        })
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        // No balance found - return zero balance
        return {
          total_unlocked_coin: '0',
          total_available_coin: '0',
          round: null,
          time: null,
        }
      }

      // Use the first result (should only be one for Amulet)
      const balance = data[0]

      // Return balance in format compatible with existing usage
      // total_balance is a number, convert to string for consistency
      return {
        total_unlocked_coin: String(balance.total_balance ?? 0),
        total_available_coin: String(balance.total_balance ?? 0),
        round: null,
        time: balance.last_updated ?? null,
      }
    } catch (error) {
      log('Error fetching Canton balance:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Canton balance',
      })
    }
  }),
})
