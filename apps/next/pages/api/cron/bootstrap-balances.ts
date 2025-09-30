import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * Bootstrap ERC20 balances from historical transfers
 *
 * This endpoint runs the recalculate_erc20_balances function to populate
 * the erc20_balances table from all historical send_account_transfers data.
 *
 * Should be run:
 * - Once after initial deployment
 * - Periodically (daily) as a verification/reconciliation step
 * - Manually when balance discrepancies are detected
 *
 * Schedule: Daily at 3am (or manual trigger)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron request')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const startTime = Date.now()

    // Run the balance recalculation function
    const { data, error } = await supabase.rpc('recalculate_erc20_balances')

    if (error) {
      console.error('Failed to recalculate balances:', error)
      return res.status(500).json({
        error: error.message,
        details: error,
      })
    }

    const duration = Date.now() - startTime

    console.log('✅ Balance recalculation complete:', {
      processedCount: data?.[0]?.processed_count || 0,
      durationMs: duration,
    })

    return res.status(200).json({
      success: true,
      processedCount: data?.[0]?.processed_count || 0,
      durationMs: duration,
      message: `Recalculated ${data?.[0]?.processed_count || 0} balances in ${duration}ms`,
    })
  } catch (error) {
    console.error('Unexpected error in bootstrap-balances:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
