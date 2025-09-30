import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type UndiscoveredToken = {
  token_address: Uint8Array
  chain_id: string
  block_time: string
  tx_hash: Uint8Array
}

/**
 * Cron job to discover ERC20 tokens from historical transfers
 *
 * This endpoint:
 * 1. Queries send_account_transfers for tokens not yet in erc20_tokens
 * 2. Inserts placeholder records (will be enriched by enrich-token-data cron)
 * 3. Initializes activity tracking
 *
 * This is primarily for bootstrapping from existing data.
 * Going forward, the trigger on send_account_transfers will handle discovery automatically.
 *
 * Schedule: Every hour (or run manually for bootstrap)
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
    // Get undiscovered tokens from send_account_transfers
    const { data: tokens, error: fetchError } = await supabase.rpc('get_undiscovered_tokens', {
      limit_count: 100, // Process 100 tokens per run
    })

    if (fetchError) {
      console.error('Failed to fetch undiscovered tokens:', fetchError)
      return res.status(500).json({ error: fetchError.message })
    }

    if (!tokens || tokens.length === 0) {
      return res.status(200).json({
        discovered: 0,
        message: 'No new tokens to discover',
      })
    }

    console.log(`Discovering ${tokens.length} tokens...`)

    const discovered: string[] = []
    const failed: string[] = []

    // Insert each token as a placeholder
    for (const token of tokens as UndiscoveredToken[]) {
      const addressHex = `0x${Buffer.from(token.token_address).toString('hex')}`

      try {
        // Insert placeholder token record
        const { error: tokenError } = await supabase.from('erc20_tokens').insert({
          address: token.token_address,
          chain_id: token.chain_id,
          block_num: 0, // Will be set by trigger
          block_time: token.block_time,
          tx_hash: token.tx_hash,
          // name, symbol, decimals will be NULL (enriched by enrich-token-data cron)
        })

        if (tokenError) {
          // Ignore conflicts (already exists)
          if (tokenError.code !== '23505') {
            console.error(`Failed to insert token ${addressHex}:`, tokenError)
            failed.push(addressHex)
            continue
          }
        }

        // Initialize activity tracking
        const { error: activityError } = await supabase.from('erc20_token_activity').insert({
          token_address: token.token_address,
          chain_id: token.chain_id,
        })

        if (activityError) {
          // Ignore conflicts (already exists)
          if (activityError.code !== '23505') {
            console.error(`Failed to insert activity for ${addressHex}:`, activityError)
          }
        }

        console.log(`✅ Discovered token: ${addressHex}`)
        discovered.push(addressHex)
      } catch (error) {
        console.error(`❌ Failed to discover ${addressHex}:`, error)
        failed.push(addressHex)
      }
    }

    return res.status(200).json({
      processed: tokens.length,
      discovered: discovered.length,
      failed: failed.length,
      discoveredTokens: discovered,
      failedTokens: failed,
    })
  } catch (error) {
    console.error('Unexpected error in discover-tokens:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
