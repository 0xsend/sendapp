import { Button, Card, Link, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronRight } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { useSendEarnBalances, useVaultConvertSharesToAssets } from '../earn/hooks'
import { useIsPriceHidden } from './utils/useIsPriceHidden'
import { formatUnits } from 'viem'

export const SavingsBalanceCard = () => {
  const { isPriceHidden } = useIsPriceHidden()
  const { data: balances, isLoading } = useSendEarnBalances()
  // Extract vaults and shares from balances for conversion
  const vaults =
    balances
      ?.filter((balance) => balance.shares > 0n && balance.log_addr !== null)
      .map((balance) => balance.log_addr) || []

  const shares =
    balances
      ?.filter((balance) => balance.shares > 0n && balance.log_addr !== null)
      .map((balance) => balance.shares) || []

  // Use the hook to get current asset values based on onchain rate
  const currentAssets = useVaultConvertSharesToAssets({ vaults, shares })

  const totalAssets = useMemo(
    () => formatUSDCValue(currentAssets.data?.reduce((sum, assets) => sum + assets, 0n) ?? 0n),
    [currentAssets.data]
  )

  return (
    <Card py="$5" px="$4" w={'100%'} jc="space-between">
      <Link href={'/earn'}>
        <YStack jc={'center'} gap={'$5'} w={'100%'}>
          <YStack w={'100%'} gap={'$2.5'} jc="space-between">
            <XStack ai={'center'} jc={'space-between'} gap="$2.5" width={'100%'}>
              <Paragraph fontSize={'$7'} fontWeight="400">
                Savings
              </Paragraph>
              <Button
                chromeless
                backgroundColor="transparent"
                hoverStyle={{ backgroundColor: 'transparent' }}
                pressStyle={{
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                }}
                focusStyle={{ backgroundColor: 'transparent' }}
                p={0}
                height={'auto'}
              >
                <Button.Icon>
                  <ChevronRight
                    size={'$1.5'}
                    color={'$primary'}
                    $theme-light={{ color: '$color12' }}
                  />
                </Button.Icon>
              </Button>
            </XStack>
          </YStack>
          <Paragraph fontSize={'$10'} fontWeight={'600'} color={'$color12'}>
            {(() => {
              switch (true) {
                case isPriceHidden:
                  return '///////'
                case isLoading || !balances:
                  return <Spinner size={'large'} />
                default:
                  return `$${totalAssets}`
              }
            })()}
          </Paragraph>
          <Paragraph fontSize={'$4'} color={'$color10'}>
            Up to 12% interest
          </Paragraph>
        </YStack>
      </Link>
    </Card>
  )
}

const formatUSDCValue = (value: bigint): string => {
  const valueInUSDC = Number(formatUnits(value, 6))
  return formatAmount(valueInUSDC, 9, 0)
}
