import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../../trpc'
import { CoingeckoCoinSchema, CoinIdEnum, MarketChartSchema } from 'app/utils/coin-gecko'

const COINGECKO_PRO_KEY = process.env.COINGECKO_PRO_KEY
const getBase = () =>
  COINGECKO_PRO_KEY ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3'
const getHeaders = () => {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (COINGECKO_PRO_KEY) headers['x-cg-pro-api-key'] = COINGECKO_PRO_KEY
  return headers
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders() })
  if (!res.ok) {
    // If Pro request fails (e.g., 402/429), try Free API fallback
    if (COINGECKO_PRO_KEY && (res.status === 402 || res.status === 429)) {
      const freeUrl = url.replace('https://pro-api.coingecko.com', 'https://api.coingecko.com')
      const freeRes = await fetch(freeUrl, { headers: { accept: 'application/json' } })
      if (!freeRes.ok) throw new Error(`CoinGecko fallback failed: ${freeRes.status}`)
      return (await freeRes.json()) as T
    }
    throw new Error(`CoinGecko request failed: ${res.status}`)
  }
  return (await res.json()) as T
}

const CoinInputSchema = z.object({
  token: CoinIdEnum, // must be one of our supported coingecko ids
})

const ChartInputSchema = z.object({
  token: CoinIdEnum, // restricted to supported coingecko ids
  // Limit days to the values used by our app timeframes
  days: z.enum(['1', '7', '30', '90', '180', '365', 'max']).default('7'),
  vsCurrency: z.literal('usd').optional().default('usd'),
  // We do not accept interval from clients; we always compute it server-side as null
  // precision must always be 'full'
  precision: z.literal('full').optional().default('full'),
})

const resolveTokenId = (token: z.infer<typeof CoinIdEnum>) => token

export const coinGeckoRouter = createTRPCRouter({
  getCoingeckoCoin: publicProcedure.input(CoinInputSchema).query(async ({ input, ctx }) => {
    const id = await resolveTokenId(input.token)

    const base = getBase()
    const url = `${base}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`

    const json = await fetchJson(url)
    const coingeckoCoin = CoingeckoCoinSchema.parse(json)

    // Vercel CDN caching across users
    try {
      // when market_data included, keep short TTL to avoid stale pricing
      ctx.res?.setHeader?.('Cache-Coi wthntrol', 'public, s-maxage=120, stale-while-revalidate=600')
    } catch {}

    return coingeckoCoin
  }),

  getMarketChart: publicProcedure.input(ChartInputSchema).query(async ({ input, ctx }) => {
    const id = await resolveTokenId(input.token)

    const base = getBase()
    const url = new URL(`${base}/coins/${id}/market_chart`)
    url.searchParams.set('vs_currency', input.vsCurrency ?? 'usd')
    url.searchParams.set('days', input.days)
    // Force our preferred params: no interval, precision=full
    url.searchParams.delete('interval')
    url.searchParams.set('precision', 'full')

    const json = await fetchJson(url.toString())
    const coingeckoChart = MarketChartSchema.parse(json)

    try {
      // Adjust TTL to match CG data cadence by days
      const ttl = input.days === '1' ? 300 : ['7', '30', '90'].includes(input.days) ? 3600 : 86400
      ctx.res?.setHeader?.(
        'Cache-Control',
        `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 6}`
      )
    } catch {}

    return coingeckoChart
  }),

  // Convenience: fetch coin + chart concurrently
  getCoinAndChart: publicProcedure
    .input(
      CoinInputSchema.and(ChartInputSchema.pick({ days: true, vsCurrency: true, precision: true }))
    )
    .query(async ({ input, ctx }) => {
      const id = await resolveTokenId(input.token)

      const base = getBase()

      const coinUrl = `${base}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      const chartUrl = (() => {
        const url = new URL(`${base}/coins/${id}/market_chart`)
        url.searchParams.set('vs_currency', input.vsCurrency ?? 'usd')
        url.searchParams.set('days', input.days)
        // Force our preferred params: no interval, precision=full
        url.searchParams.delete('interval')
        url.searchParams.set('precision', 'full')
        return url.toString()
      })()

      const [coinJson, chartJson] = await Promise.all([
        (async () => {
          const j = await fetchJson(coinUrl)
          return CoingeckoCoinSchema.parse(j)
        })(),
        (async () => {
          const j = await fetchJson(chartUrl)
          return MarketChartSchema.parse(j)
        })(),
      ])

      try {
        ctx.res?.setHeader?.('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')
      } catch {}

      return { coingeckoCoin: coinJson, coingeckoChart: chartJson }
    }),
})
