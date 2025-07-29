import { Card, type CardProps, Paragraph, Spinner, XStack } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'
import { ChevronRight } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { useIsPriceHidden } from './utils/useIsPriceHidden'
import { formatUnits, zeroAddress } from 'viem'
import { type LinkProps, useLink } from 'solito/link'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useSendAccount } from 'app/utils/send-accounts'
import { useQuery } from '@tanstack/react-query'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import {
  baseMainnetClient,
  type sendMerkleDropAddress,
  sendTokenAddress,
  sendTokenV0Address,
} from '@my/wagmi'
import { sendCoin } from 'app/data/coins'
import { HomeBodyCard } from './screen'

import { type MerkleDropClaimParams, useSendMerkleDropsAreClaimed } from 'app/utils/distributions'
import { byteaToHex } from 'app/utils/byteaToHex'

export const RewardsCard = ({ href, ...props }: Omit<CardProps & LinkProps, 'children'>) => {
  const linkProps = useLink({ href })
  const { isPriceHidden } = useIsPriceHidden()
  const { data: prices, isLoading: isPricesLoading } = useTokenPrices()
  const { data: distributions, isLoading: isDistributionLoading } = useDistributionShares()

  const [currentDistribution, pastDistributions] = useMemo(() => {
    if (!distributions) return [null, []]
    const [current, ...past] = distributions
    return [current, past]
  }, [distributions])

  const merkleDrops = useMemo(() => {
    return (
      pastDistributions
        .map((distribution) => {
          const share = distribution.distribution_shares[0]

          return {
            chainId: distribution.chain_id as keyof typeof sendMerkleDropAddress,
            tranche: BigInt(distribution.tranche_id),
            index: BigInt(share?.index ?? -1n),
            address: distribution.merkle_drop_addr
              ? byteaToHex(distribution.merkle_drop_addr as `\\x${string}`)
              : zeroAddress,
          }
        })
        .filter(Boolean) ?? ([] as MerkleDropClaimParams[])
    )
  }, [pastDistributions])

  const { data: dropsIsClaimedResults, isLoading: isDropsClaimedLoading } =
    useSendMerkleDropsAreClaimed(merkleDrops)

  const currentShares = BigInt(currentDistribution?.distribution_shares?.[0]?.amount ?? 0n)

  // Calculate total unclaimed rewards from past distributions
  const unclaimedShares = useMemo(() => {
    if (!distributions) return 0n

    return pastDistributions.reduce((total, distribution, index) => {
      const share = distribution.distribution_shares[0]
      const isClaimed = dropsIsClaimedResults?.[index]?.result
      const tokenAddress = distribution.token_addr
        ? byteaToHex(distribution.token_addr as `\\x${string}`)
        : null
      const isSendV0 = tokenAddress === sendTokenV0Address[baseMainnetClient.chain.id]
      if (isClaimed !== undefined && !isClaimed && share?.amount) {
        if (isSendV0) {
          const convertedAmount = BigInt(share.amount) * 10n ** 16n
          return total + convertedAmount
        }
        return total + BigInt(share.amount)
      }
      return total
    }, 0n)
  }, [distributions, dropsIsClaimedResults, pastDistributions])

  const sendPrice = prices?.[sendTokenAddress[baseMainnetClient.chain.id]] ?? 0

  // Use the hook to get total asset values based on onchain rate
  const totalRewardsValue = useMemo(() => {
    const shares = Number(formatUnits(unclaimedShares + currentShares, sendCoin.decimals))
    const totalValue = shares * sendPrice
    return totalValue > 1 ? formatAmount(totalValue, 3, 0) : formatAmount(totalValue, 1, 2)
  }, [unclaimedShares, sendPrice, currentShares])

  const isLoading = isPricesLoading || isDistributionLoading || isDropsClaimedLoading

  return (
    <HomeBodyCard {...linkProps} {...props}>
      <Card.Header padded pb={0} fd="row" ai="center" jc="space-between">
        <Paragraph
          fontSize={'$5'}
          fontWeight="400"
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
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
        <Paragraph color={'$color12'} fontWeight={600} size={'$9'} lineHeight={34}>
          {(() => {
            switch (true) {
              case isPriceHidden:
                return '///////'
              case isLoading:
                return <Spinner size={'large'} color={'$color12'} />
              default:
                return `$${totalRewardsValue}`
            }
          })()}
        </Paragraph>
      </Card.Footer>
    </HomeBodyCard>
  )
}

const useDistributionShares = () => {
  const supabase = useSupabase()
  const { data: sendAccount } = useSendAccount()

  return useQuery({
    queryKey: ['distribution_shares', sendAccount?.created_at],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distributions')
        .select(
          `
          number,
          token_addr,
          chain_id,
          merkle_drop_addr,
          tranche_id::text,
          token_decimals,
          distribution_shares(
            amount::text,
            index::text
          )
        `
        )
        .lte('qualification_start', new Date().toUTCString())
        .gt('qualification_end', sendAccount?.created_at)
        .not('distribution_shares[0]', 'is', null) // checks if first element exists
        .gte('number', 6)
        .order('number', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: Boolean(sendAccount?.created_at),
  })
}
