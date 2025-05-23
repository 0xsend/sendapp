import { Button, Card, type CardProps, H1, Paragraph, Spinner, XStack } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronRight } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { useSendEarnBalances, useVaultConvertSharesToAssets } from '../earn/hooks'
import { useIsPriceHidden } from './utils/useIsPriceHidden'
import { formatUnits } from 'viem'
import { type LinkProps, useLink } from 'solito/link'

export const SavingsBalanceCard = ({ href, ...props }: Omit<CardProps & LinkProps, 'children'>) => {
  const linkProps = useLink({ href })
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
    <Card
      elevate
      hoverStyle={{ scale: 0.925 }}
      pressStyle={{ scale: 0.875 }}
      animation="bouncy"
      size={'$5'}
      br="$7"
      {...linkProps}
      {...props}
    >
      <Card.Header padded fd="row" ai="center" jc="space-between">
        <Paragraph fontSize={'$7'} fontWeight="400">
          Save
        </Paragraph>
        <XStack flex={1} />
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
              color={'$lightGrayTextField'}
              $theme-light={{ color: '$darkGrayTextField' }}
            />
          </Button.Icon>
        </Button>
      </Card.Header>
      <Card.Footer padded>
        <H1 color={'$color12'}>
          {(() => {
            switch (true) {
              case isPriceHidden:
                return '///////'
              case isLoading || !balances:
                return <Spinner size={'large'} color={'$color12'} />
              default:
                return `$${totalAssets}`
            }
          })()}
        </H1>
      </Card.Footer>
    </Card>
  )
}

const formatUSDCValue = (value: bigint): string => {
  const valueInUSDC = Number(formatUnits(value, 6))
  return formatAmount(valueInUSDC, 9, 0)
}
