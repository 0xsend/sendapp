import type { SupabaseClient } from '@supabase/supabase-js'
import type { PublicClient, Address } from 'viem'
import type { Logger } from 'pino'

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

export type EnrichmentWorkerConfig = {
  batchSize: number
  rateLimitMs: number
  pollIntervalMs: number
  chainId: number
  coingeckoApiKey?: string
}

export type EnrichmentWorkerDependencies = {
  supabase: SupabaseClient
  publicClient: PublicClient
  logger: Logger
  config: EnrichmentWorkerConfig
}

export class EnrichmentWorker {
  private supabase: SupabaseClient
  private publicClient: PublicClient
  private logger: Logger
  private config: EnrichmentWorkerConfig
  private isRunning = false
  private pollTimer?: NodeJS.Timeout

  constructor(deps: EnrichmentWorkerDependencies) {
    this.supabase = deps.supabase
    this.publicClient = deps.publicClient
    this.logger = deps.logger
    this.config = deps.config
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Worker already running')
      return
    }

    this.isRunning = true
    this.logger.info('Token enrichment worker started')

    await this.poll()
  }

  async stop(): Promise<void> {
    this.isRunning = false
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
    }
    this.logger.info('Token enrichment worker stopped')
  }

  private async poll(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.enrichTokens()
      } catch (error) {
        this.logger.error({ error }, 'Error in enrichment loop')
      }

      if (this.isRunning) {
        await new Promise((resolve) => {
          this.pollTimer = setTimeout(resolve, this.config.pollIntervalMs)
        })
      }
    }
  }

  private async enrichTokens(): Promise<void> {
    const startTime = Date.now()

    // Get tokens that need enrichment
    const { data: tokens, error: fetchError } = await this.supabase.rpc(
      'get_tokens_needing_enrichment',
      {
        limit_count: this.config.batchSize,
      }
    )

    if (fetchError) {
      this.logger.error({ error: fetchError }, 'Failed to fetch tokens needing enrichment')
      return
    }

    if (!tokens || tokens.length === 0) {
      this.logger.info('No tokens need enrichment')
      return
    }

    this.logger.info({ count: tokens.length }, 'Processing tokens for enrichment')

    let enriched = 0
    let failed = 0

    for (const token of tokens as TokenToEnrich[]) {
      try {
        const success = await this.enrichToken(token)
        if (success) {
          enriched++
        } else {
          failed++
        }
      } catch (error) {
        this.logger.error({ error, token }, 'Failed to enrich token')
        failed++
      }

      // Rate limiting for CoinGecko API
      if (this.config.rateLimitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.config.rateLimitMs))
      }
    }

    const duration = Date.now() - startTime
    this.logger.info(
      {
        processed: tokens.length,
        enriched,
        failed,
        duration,
      },
      'Enrichment loop completed'
    )
  }

  private async enrichToken(token: TokenToEnrich): Promise<boolean> {
    const addressHex = `0x${Buffer.from(token.token_address).toString('hex')}` as Address
    const chainId = Number.parseInt(token.chain_id)

    try {
      // Read token metadata from contract
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.publicClient
          .readContract({
            address: addressHex,
            abi: ERC20_ABI,
            functionName: 'name',
          })
          .catch((err) => {
            this.logger.warn({ address: addressHex, error: err.message }, 'Failed to read name')
            return 'Unknown'
          }),

        this.publicClient
          .readContract({
            address: addressHex,
            abi: ERC20_ABI,
            functionName: 'symbol',
          })
          .catch((err) => {
            this.logger.warn({ address: addressHex, error: err.message }, 'Failed to read symbol')
            return 'UNKNOWN'
          }),

        this.publicClient
          .readContract({
            address: addressHex,
            abi: ERC20_ABI,
            functionName: 'decimals',
          })
          .catch((err) => {
            this.logger.warn({ address: addressHex, error: err.message }, 'Failed to read decimals')
            return 18
          }),

        this.publicClient
          .readContract({
            address: addressHex,
            abi: ERC20_ABI,
            functionName: 'totalSupply',
          })
          .catch((err) => {
            this.logger.warn(
              { address: addressHex, error: err.message },
              'Failed to read totalSupply'
            )
            return BigInt(0)
          }),
      ])

      // Update token in database
      const { error: updateError } = await this.supabase
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
        this.logger.error({ error: updateError, address: addressHex }, 'Failed to update token')
        return false
      }

      this.logger.info({ address: addressHex, symbol }, 'Enriched token on-chain data')

      // Fetch metadata from CoinGecko
      const coinGeckoData = await this.fetchCoinGeckoMetadata(addressHex.toLowerCase(), chainId)

      if (coinGeckoData) {
        const { error: metadataError } = await this.supabase.from('erc20_token_metadata').upsert(
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
          this.logger.error(
            { error: metadataError, address: addressHex },
            'Failed to upsert metadata'
          )
        } else {
          this.logger.info({ address: addressHex, symbol }, 'Enriched CoinGecko metadata')
        }
      } else {
        // Track failed enrichment attempt
        await this.supabase.from('erc20_token_metadata').upsert(
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

        this.logger.warn({ address: addressHex, symbol }, 'No CoinGecko data found')
      }

      return true
    } catch (error) {
      this.logger.error({ error, address: addressHex }, 'Failed to enrich token')
      return false
    }
  }

  private async fetchCoinGeckoMetadata(
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
        this.logger.warn({ chainId }, 'No CoinGecko platform mapping for chain')
        return null
      }

      const apiKey = this.config.coingeckoApiKey
      const headers: HeadersInit = apiKey ? { 'x-cg-pro-api-key': apiKey } : {}

      const url = apiKey
        ? `https://pro-api.coingecko.com/api/v3/coins/${platform}/contract/${address}`
        : `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}`

      const response = await fetch(url, { headers })

      if (!response.ok) {
        this.logger.warn(
          { address, status: response.status },
          'CoinGecko API returned non-OK status'
        )
        return null
      }

      return await response.json()
    } catch (error) {
      this.logger.error({ error, address }, 'Error fetching CoinGecko data')
      return null
    }
  }
}
