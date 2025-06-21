import { Card, type CardProps, Paragraph, Spinner } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronRight } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { useSendEarnAPY } from '../earn/hooks'
import { useSendEarnCoin } from '../earn/providers/SendEarnProvider'
import { useIsPriceHidden } from './utils/useIsPriceHidden'
import { formatUnits } from 'viem'
import { type LinkProps, useLink } from 'solito/link'
import { HomeBodyCard } from './screen'
import { usdcCoin } from 'app/data/coins'

export const SavingsBalanceCard = ({ href, ...props }: Omit<CardProps & LinkProps, 'children'>) => {
  const linkProps = useLink({ href })
  const { isPriceHidden } = useIsPriceHidden()

  // Use the SendEarnProvider pattern
  const { coinBalances, getTotalAssets } = useSendEarnCoin(usdcCoin)
  const { totalCurrentValue, vaults } = getTotalAssets()

  const hasExistingDeposit = totalCurrentValue > 0n

  // Only fetch APY if user has existing deposits
  const { data: apyData, isLoading: isApyLoading } = useSendEarnAPY({
    vault: hasExistingDeposit && vaults?.[0] ? vaults[0] : undefined,
  })

  const totalAssets = useMemo(() => {
    if (!hasExistingDeposit) return formatUSDCValue(0n)
    return formatUSDCValue(totalCurrentValue)
  }, [hasExistingDeposit, totalCurrentValue])

  // Single loader for both values
  const isLoading = coinBalances.isLoading || (hasExistingDeposit && isApyLoading)

  return (
    <HomeBodyCard {...linkProps} {...props}>
      <Card.Header padded pb="$4" jc="space-between" fd="row">
        <Paragraph fontSize={'$5'} fontWeight="400">
          Save
        </Paragraph>

        <ChevronRight
          size={'$1'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        />
      </Card.Header>
      <Card.Footer padded size="$4" pt={0} fd="column" gap="$4">
        {isLoading ? (
          <Spinner size={'large'} color={'$color12'} />
        ) : (
          <>
            <Paragraph color={'$color12'} fontWeight={600} size={'$9'}>
              {isPriceHidden ? '///////' : `$${totalAssets}`}
            </Paragraph>
            <Paragraph color={'$color10'}>
              {hasExistingDeposit
                ? `Earning ${apyData?.baseApy.toFixed(2)}%`
                : 'Up to 10% Interest'}
            </Paragraph>
          </>
        )}
      </Card.Footer>
    </HomeBodyCard>
  )
}

const formatUSDCValue = (value: bigint): string => {
  const valueInUSDC = Number(formatUnits(value, 6))
  return formatAmount(valueInUSDC, 9, 2)
}
