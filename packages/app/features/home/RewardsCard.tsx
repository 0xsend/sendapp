import { Card, type CardProps, Paragraph, Spinner, XStack } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'
import { ChevronRight } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { useIsPriceHidden } from './utils/useIsPriceHidden'
import { formatUnits } from 'viem'
import { type LinkProps, useLink } from 'solito/link'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useSendAccount } from 'app/utils/send-accounts'
import { useQuery } from '@tanstack/react-query'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { baseMainnetClient, sendTokenAddress } from '@my/wagmi'
import { coinsDict } from 'app/data/coins'
import { HomeBodyCard } from './screen'

export const RewardsCard = ({ href, ...props }: Omit<CardProps & LinkProps, 'children'>) => {
  const linkProps = useLink({ href })
  const { isPriceHidden } = useIsPriceHidden()
  const { data: prices, isLoading: isPricesLoading } = useTokenPrices()
  const { data: distribution, isLoading: isDistributionLoading } = useCurrentDistributionShares()
  const shares = Number(
    formatUnits(
      BigInt(distribution?.distribution_shares?.[0]?.amount ?? 0n),
      coinsDict[sendTokenAddress[baseMainnetClient.chain.id]]?.formatDecimals ?? 18
    )
  )
  const sendPrice = prices?.[sendTokenAddress[baseMainnetClient.chain.id]] ?? 0

  // Use the hook to get current asset values based on onchain rate
  const sharesValue = useMemo(() => formatAmount(shares * sendPrice, 0, 0), [shares, sendPrice])

  const isLoading = isPricesLoading || isDistributionLoading

  return (
    <HomeBodyCard {...linkProps} {...props}>
      <Card.Header padded pb={0} fd="row" ai="center" jc="space-between">
        <Paragraph fontSize={'$5'} fontWeight="400">
          Rewards
        </Paragraph>
        <XStack flex={1} />
        <ChevronRight
          size={'$1'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        />
      </Card.Header>
      <Card.Footer padded pt={0} fd="column">
        <Paragraph color={'$color12'} fontWeight={500} size={'$10'}>
          {(() => {
            switch (true) {
              case isPriceHidden:
                return '///////'
              case isLoading || !sharesValue:
                return <Spinner size={'large'} color={'$color12'} />
              default:
                return `$${sharesValue}`
            }
          })()}
        </Paragraph>
        <Paragraph color={'$color10'}>Complete Tasks for $SEND Back</Paragraph>
      </Card.Footer>
    </HomeBodyCard>
  )
}

const useCurrentDistributionShares = () => {
  const supabase = useSupabase()
  const { data: sendAccount } = useSendAccount()

  return useQuery({
    queryKey: ['current_distribution_shares', supabase, sendAccount?.created_at],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distributions')
        .select(`
          number,
          distribution_shares(
            amount::text
          )
        `)
        .order('number', { ascending: false })
        .limit(1)
        .single()
      if (error) throw error
      return data
    },
    enabled: Boolean(sendAccount?.created_at),
  })
}
