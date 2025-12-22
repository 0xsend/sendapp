import { CheckPublicPreviewScreen } from 'app/features/check/claim/public-preview'
import type { NextPageWithLayout } from '../../_app'
import { AuthLayout } from 'app/features/auth/layout.web'
import { useRouter } from 'next/router'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database, PgBytea } from '@my/supabase/database.types'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { buildSeo } from 'utils/seo'
import { generateCheckSeoData, formatAmountForDisplay, type CheckSeoData } from 'utils/seoHelpers'
import { formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { allCoinsDict, type coin } from 'app/data/coins'
import { baseMainnetClient } from '@my/wagmi'
import { parseCheckCode } from 'app/utils/useSendCheckClaim'
import { byteaToHex } from 'app/utils/byteaToHex'

interface PageProps {
  seo: ReturnType<typeof buildSeo>
}

export const Page: NextPageWithLayout<PageProps> = () => {
  const router = useRouter()
  const code = (router.query.code as string) ?? ''

  return <CheckPublicPreviewScreen checkCode={code} />
}

/**
 * Find coin by token address (case-insensitive)
 */
function findCoinByToken(tokenAddress: `0x${string}`): coin | undefined {
  const lowerToken = tokenAddress.toLowerCase()
  for (const [token, coinData] of Object.entries(allCoinsDict)) {
    if (token.toLowerCase() === lowerToken) {
      return coinData
    }
  }
  return undefined
}

/**
 * Format coin amount for OG image display.
 */
function formatCoinAmountString(amount: bigint, coinData: coin): string {
  const formatted = formatUnits(amount, coinData.decimals)
  return formatAmountForDisplay(formatted)
}

type GetCheckRow =
  Database['public']['Functions']['get_check_by_ephemeral_address']['Returns'][number]

export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
  const { code: codeParam } = ctx.params ?? {}
  const code = codeParam?.toString() ?? ''

  // Get site URL
  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://send.app'

  // Default SEO for invalid/missing checks
  const defaultSeo = buildSeo({
    title: 'Claim Check | Send',
    description: 'Someone sent you tokens! Create an account to claim.',
    url: `${siteUrl}/check/public/${code}`,
    type: 'website',
  })

  // Parse check code to get ephemeral address
  const privateKey = parseCheckCode(code)
  if (!privateKey) {
    // Invalid check code format - still render page (will show error in UI)
    return {
      props: {
        seo: defaultSeo,
      },
    }
  }

  try {
    const ephemeralAccount = privateKeyToAccount(privateKey)
    const chainId = baseMainnetClient.chain.id

    // Convert address to bytea format for Supabase
    const addressBytes = `\\x${ephemeralAccount.address.slice(2).toLowerCase()}` as PgBytea

    // Fetch check details from database
    const supabaseAdmin = createSupabaseAdminClient()
    const { data, error } = await supabaseAdmin.rpc('get_check_by_ephemeral_address', {
      check_ephemeral_address: addressBytes,
      check_chain_id: chainId,
    })

    if (error) {
      console.error('Error fetching check:', error)
      return { props: { seo: defaultSeo } }
    }

    const row = (data as GetCheckRow[])?.[0]
    if (!row) {
      // Check not found
      return { props: { seo: defaultSeo } }
    }

    // Check if claimed or canceled
    if (row.is_claimed || row.is_canceled) {
      return { props: { seo: defaultSeo } }
    }

    // Parse tokens and amounts
    const tokens = row.tokens.map((t) => byteaToHex(t as PgBytea))
    const amounts = row.amounts.map((a) => BigInt(a ?? 0))

    // Find the primary token (first one with a known coin)
    let primaryAmount: string | undefined
    let primarySymbol: string | undefined
    let additionalCount = 0

    for (let i = 0; i < tokens.length; i++) {
      const tokenAddress = tokens[i]
      const amount = amounts[i]
      if (!tokenAddress || amount === undefined) continue

      const coinData = findCoinByToken(tokenAddress)
      if (coinData && amount > BigInt(0)) {
        if (!primaryAmount) {
          // First valid token becomes primary
          primaryAmount = formatCoinAmountString(amount, coinData)
          primarySymbol = coinData.symbol
        } else {
          // Count additional tokens
          additionalCount++
        }
      }
    }

    // Build check SEO data
    const checkData: CheckSeoData = {
      amount: primaryAmount,
      symbol: primarySymbol,
      additionalCount: additionalCount > 0 ? additionalCount : undefined,
    }

    const checkSeoData = generateCheckSeoData(checkData, {
      siteUrl,
      route: `/check/public/${code}`,
    })

    const seo = buildSeo({
      title: checkSeoData.title,
      description: checkSeoData.description,
      url: checkSeoData.canonicalUrl,
      image: checkSeoData.imageUrl,
      type: 'website',
    })

    // Cache for anonymous users (social media crawlers)
    ctx.res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, max-age=60, stale-while-revalidate=600'
    )

    return {
      props: {
        seo,
      },
    }
  } catch (err) {
    console.error('Error in getServerSideProps for check:', err)
    return { props: { seo: defaultSeo } }
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
