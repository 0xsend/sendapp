import { Card, type CardProps, Paragraph, Shimmer, YStack } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronRight } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { useSendEarnAPY } from '../earn/hooks'
import { useSendEarnCoin } from '../earn/providers/SendEarnProvider'
import { useIsPriceHidden } from './utils/useIsPriceHidden'
import { formatUnits } from 'viem'
import { useLink } from 'solito/link'
import { HomeBodyCard } from './screen'
import { usdcCoin } from 'app/data/coins'
import { Platform } from 'react-native'
import { useSendAccount } from 'app/utils/send-accounts'

export const SavingsBalanceCard = (props: Omit<CardProps, 'children'>) => {
  const { isPriceHidden, isPriceHiddenLoading } = useIsPriceHidden()
  const { data: sendAccount } = useSendAccount()

  // Use the SendEarnProvider pattern
  const {
    totalAssets: { totalCurrentValue, vaults, currentAssetsQueryEnabled },
  } = useSendEarnCoin(usdcCoin)

  const hasExistingDeposit = totalCurrentValue > 0n

  // Determine navigation target based on deposit status
  const href = useMemo(
    () => (hasExistingDeposit ? '/earn/usdc' : '/earn/usdc/deposit'),
    [hasExistingDeposit]
  )
  const linkProps = useLink({ href })

  // Only fetch APY if user has existing deposits
  const {
    query: { data: apyData, isLoading: isApyLoading },
    enabled: apyEnabled,
  } = useSendEarnAPY({
    vault: hasExistingDeposit && vaults?.[0] ? vaults[0] : undefined,
  })

  const totalAssets = useMemo(() => {
    if (!hasExistingDeposit) return formatUSDCValue(0n)
    return formatUSDCValue(totalCurrentValue)
  }, [hasExistingDeposit, totalCurrentValue])

  const isLoading = isApyLoading || isPriceHiddenLoading || !sendAccount
  // !apyEnabled ||
  // !currentAssetsQueryEnabled

  return (
    <HomeBodyCard {...linkProps} {...props}>
      <Card.Header padded pb="$4" jc="space-between" fd="row">
        <Paragraph
          fontSize={'$5'}
          fontWeight="400"
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Save
        </Paragraph>

        <ChevronRight
          size={'$1'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        />
      </Card.Header>
      <Card.Footer padded size="$4" pt={0} fd="column" gap={Platform.OS === 'web' ? '$2' : '$1'}>
        {isLoading ? (
          <YStack gap="$2" zi={1}>
            <Shimmer w={80} h={34} br={5} />
            <Shimmer w={100} h={20} br={5} />
          </YStack>
        ) : (
          <YStack gap="$3">
            <Paragraph color={'$color12'} fontWeight={600} size={'$9'} lineHeight={34}>
              {isPriceHidden ? '******' : `$${totalAssets}`}
            </Paragraph>
            <Paragraph color={'$color10'}>
              {hasExistingDeposit && apyData?.baseApy
                ? `Earning ${apyData.baseApy.toFixed(2)}%`
                : 'Up to 10% Interest'}
            </Paragraph>
          </YStack>
        )}
      </Card.Footer>
    </HomeBodyCard>
  )
}

const formatUSDCValue = (value: bigint): string => {
  const valueInUSDC = Number(formatUnits(value, 6))
  return formatAmount(valueInUSDC, 9, 2)
}
