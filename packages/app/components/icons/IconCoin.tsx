import type { IconProps } from '@tamagui/helpers-icon'
import { Image } from '@my/ui'
import { Coins } from '@tamagui/lucide-icons'
import type { Address } from 'viem'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useQuery } from '@tanstack/react-query'
import { baseMainnet } from '@my/wagmi'

/**
 * Hook to fetch token logo URL from database
 */
function useTokenLogo(tokenAddress?: Address | 'eth' | string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['token-logo', tokenAddress],
    queryFn: async () => {
      if (!tokenAddress || tokenAddress === 'eth' || !tokenAddress.startsWith('0x')) return null

      const addressBytes = tokenAddress.toLowerCase().slice(2)

      const { data } = await supabase
        .from('erc20_token_metadata')
        .select('logo_url')
        .eq('token_address', `\\x${addressBytes}`)
        .eq('chain_id', baseMainnet.id)
        .single()

      return data?.logo_url || null
    },
    enabled: !!tokenAddress && tokenAddress !== 'eth' && tokenAddress.startsWith('0x'),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  })
}

/**
 * IconCoin component that displays token logos from the database
 *
 * @param tokenAddress - The token address to fetch logo for
 * @param logoUrl - Optional: directly provide a logo URL (skips database fetch)
 */
export const IconCoin = ({
  tokenAddress,
  logoUrl: providedLogoUrl,
  ...props
}: {
  tokenAddress?: Address | 'eth' | string
  logoUrl?: string | null
} & IconProps) => {
  // Fetch logo from database if token address provided but no logo URL
  const { data: fetchedLogoUrl } = useTokenLogo(
    !providedLogoUrl && tokenAddress ? tokenAddress : undefined
  )

  const logoUrl = providedLogoUrl || fetchedLogoUrl

  // Use logo URL from database if available
  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        width={props.size || '$2.5'}
        height={props.size || '$2.5'}
        borderRadius="$12"
        {...props}
      />
    )
  }

  // Fallback to generic coin icon
  return <Coins size={'$2.5'} {...props} />
}
