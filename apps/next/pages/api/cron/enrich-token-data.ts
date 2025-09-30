import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { createPublicClient, http, type Address } from 'viem'
import { baseMainnet } from '@my/wagmi/chains'

const ERC20_ABI = [
  {
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
    inputs: [],
  },
  {
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
    inputs: [],
  },
  {
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
    inputs: [],
  },
  {
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
    inputs: [],
  },
] as const

type TokenToEnrich = {
  token_address: Uint8Array
  chain_id: string
  block_time: string
}

type CoinGeckoTokenData = {
  id: string
  symbol: string
  name: string
  image: {
    thumb: string
    small: string
    large: string
  }
  description: {
    en: string
  }
  links: {
    homepage: string[]
    twitter_screen_name: string
    telegram_channel_identifier: string
  }
  market_data: {
    current_price: {
      usd: number
    }
    market_cap: {
      usd: number
    }
    total_volume: {
      usd: number
    }
    circulating_supply: number
    max_supply: number | null
  }
}

/**
 * Fetch token metadata from CoinGecko API
 */
async function fetchCoinGeckoMetadata(
  address: string,
  chainId: number
): Promise<CoinGeckoTokenData | null> {
  try {
    // Map chain ID to CoinGecko platform ID
    const platformMap: Record<number, string> = {
      8453: 'base', // Base mainnet
      84532: 'base', // Base sepolia (treat as base)
    }

    const platform = platformMap[chainId]
    if (!platform) {
      console.warn(`No CoinGecko platform mapping for chain ${chainId}`)
      return null
    }

    const apiKey = process.env.COINGECKO_API_KEY
    const headers: HeadersInit = apiKey ? { 'x-cg-pro-api-key': apiKey } : {}

    // First, try to get token info by contract address
    const url = apiKey
      ? `https://pro-api.coingecko.com/api/v3/coins/${platform}/contract/${address}`
      : `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}`

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.warn(`CoinGecko API returned ${response.status} for ${address}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching CoinGecko data for ${address}:`, error)
    return null
  }
}

/**
 * Cron job to enrich ERC20 token metadata
 *
 * This endpoint:
 * 1. Fetches tokens that need enrichment (missing name, symbol, or decimals)
 *    - Prioritized by total balance held by users (highest first)
 *    - Then by number of holders (most holders first)
 *    - Then by block time (newest first)
 * 2. Calls the token contract to get on-chain metadata (name, symbol, decimals, totalSupply)
 * 3. Updates the erc20_tokens table with on-chain data
 * 4. Fetches off-chain metadata from CoinGecko (logo, description, price, market data)
 * 5. Updates the erc20_token_metadata table with off-chain data
 *
 * Schedule: Every 10 minutes
 * Rate limit: ~1.5s between tokens (respects CoinGecko free tier: 50 calls/min)
 * Environment variables:
 * - COINGECKO_API_KEY (optional): Pro API key for higher rate limits
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

  // Initialize viem client for Base
  const client = createPublicClient({
    chain: baseMainnet,
    transport: http(baseMainnet.rpcUrls.default.http[0]),
  })

  try {
    // Get tokens that need enrichment
    const { data: tokens, error: fetchError } = await supabase.rpc(
      'get_tokens_needing_enrichment',
      {
        limit_count: 30, // Process 30 tokens per run (~45s with 1.5s rate limit)
      }
    )

    if (fetchError) {
      console.error('Failed to fetch tokens:', fetchError)
      return res.status(500).json({ error: fetchError.message })
    }

    if (!tokens || tokens.length === 0) {
      return res.status(200).json({
        processed: 0,
        enriched: 0,
        failed: 0,
        message: 'No tokens to enrich',
      })
    }

    console.log(`Processing ${tokens.length} tokens...`)

    const enriched: string[] = []
    const failed: string[] = []

    // Process each token
    for (const token of tokens as TokenToEnrich[]) {
      const addressHex = `0x${Buffer.from(token.token_address).toString('hex')}` as Address
      const chainId = Number.parseInt(token.chain_id)

      try {
        // Read token metadata from contract
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          client
            .readContract({
              address: addressHex,
              abi: ERC20_ABI,
              functionName: 'name',
            })
            .catch((err) => {
              console.warn(`Failed to read name for ${addressHex}:`, err.message)
              return 'Unknown'
            }),

          client
            .readContract({
              address: addressHex,
              abi: ERC20_ABI,
              functionName: 'symbol',
            })
            .catch((err) => {
              console.warn(`Failed to read symbol for ${addressHex}:`, err.message)
              return 'UNKNOWN'
            }),

          client
            .readContract({
              address: addressHex,
              abi: ERC20_ABI,
              functionName: 'decimals',
            })
            .catch((err) => {
              console.warn(`Failed to read decimals for ${addressHex}:`, err.message)
              return 18
            }),

          client
            .readContract({
              address: addressHex,
              abi: ERC20_ABI,
              functionName: 'totalSupply',
            })
            .catch((err) => {
              console.warn(`Failed to read totalSupply for ${addressHex}:`, err.message)
              return BigInt(0)
            }),
        ])

        // Update token in database
        const { error: updateError } = await supabase
          .from('erc20_tokens')
          .update({
            name: name as string,
            symbol: symbol as string,
            decimals: decimals as number,
            total_supply: totalSupply.toString(),
          })
          .eq('address', token.token_address)
          .eq('chain_id', token.chain_id)

        if (updateError) {
          console.error(`Failed to update token ${addressHex}:`, updateError)
          failed.push(addressHex)
          continue
        }

        console.log(`✅ Enriched token on-chain data: ${symbol} (${addressHex})`)

        // Fetch metadata from CoinGecko
        const coinGeckoData = await fetchCoinGeckoMetadata(addressHex.toLowerCase(), chainId)

        if (coinGeckoData) {
          // Upsert metadata
          const { error: metadataError } = await supabase.from('erc20_token_metadata').upsert(
            {
              token_address: token.token_address,
              chain_id: token.chain_id,
              coingecko_id: coinGeckoData.id,
              logo_url: coinGeckoData.image?.large || coinGeckoData.image?.small,
              description: coinGeckoData.description?.en,
              website: coinGeckoData.links?.homepage?.[0] || null,
              twitter: coinGeckoData.links?.twitter_screen_name || null,
              telegram: coinGeckoData.links?.telegram_channel_identifier || null,
              price_usd: coinGeckoData.market_data?.current_price?.usd || null,
              market_cap_usd: coinGeckoData.market_data?.market_cap?.usd || null,
              volume_24h_usd: coinGeckoData.market_data?.total_volume?.usd || null,
              circulating_supply: coinGeckoData.market_data?.circulating_supply || null,
              max_supply: coinGeckoData.market_data?.max_supply || null,
              metadata_source: 'coingecko',
              last_successful_enrichment: new Date().toISOString(),
              enrichment_attempts: 1,
              last_enrichment_attempt: new Date().toISOString(),
            },
            {
              onConflict: 'token_address,chain_id',
              ignoreDuplicates: false,
            }
          )

          if (metadataError) {
            console.error(`Failed to upsert metadata for ${addressHex}:`, metadataError)
          } else {
            console.log(`✅ Enriched CoinGecko metadata for ${symbol} (${addressHex})`)
          }
        } else {
          // Track failed enrichment attempt
          await supabase.from('erc20_token_metadata').upsert(
            {
              token_address: token.token_address,
              chain_id: token.chain_id,
              enrichment_attempts: 1,
              last_enrichment_attempt: new Date().toISOString(),
            },
            {
              onConflict: 'token_address,chain_id',
              ignoreDuplicates: false,
            }
          )

          console.log(`⚠️  No CoinGecko data found for ${symbol} (${addressHex})`)
        }

        enriched.push(addressHex)
      } catch (error) {
        console.error(`❌ Failed to enrich ${addressHex}:`, error)
        failed.push(addressHex)
      }

      // Rate limiting: wait 1.5 seconds between tokens for CoinGecko free tier
      // Free tier allows ~50 calls/min = 1 call per 1.2 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    return res.status(200).json({
      processed: tokens.length,
      enriched: enriched.length,
      failed: failed.length,
      enrichedTokens: enriched,
      failedTokens: failed,
    })
  } catch (error) {
    console.error('Unexpected error in enrich-token-data:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
