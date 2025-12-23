import type { ReactNode } from 'react'
import { formatUnits } from 'viem'
import { SizableText, Spinner, Text, XStack, YStack } from '@my/ui'
import { IconCoin } from 'app/components/icons'
import formatAmount from 'app/utils/formatAmount'
import type { CoinWithBalance } from 'app/data/coins'

export interface ReviewSendDetailsRowProps {
  label: string
  value: string
}

export const ReviewSendDetailsRow = ({ label, value }: ReviewSendDetailsRowProps) => (
  <XStack ai={'flex-start'} jc={'space-between'} gap={'$4'} flexWrap="wrap">
    <SizableText col="$gray11" size="$5" flexShrink={0}>
      {label}
    </SizableText>
    <SizableText size="$5" col="$gray12" f={1} ta="right" wordWrap="break-word">
      {value}
    </SizableText>
  </XStack>
)

export interface ReviewSendAmountBoxProps {
  localizedAmount: string
  selectedCoin: CoinWithBalance | undefined
  amountInUSD: number
  isPricesLoading: boolean
  isFeesLoading: boolean
  usdcFees:
    | {
        gasFees: bigint
        baseFee: bigint
        decimals: number
      }
    | undefined
  usdcFeesError: Error | null
  children?: ReactNode
}

export const ReviewSendAmountBox = YStack.styleable<ReviewSendAmountBoxProps>((props) => {
  const {
    localizedAmount,
    selectedCoin,
    amountInUSD,
    isPricesLoading,
    isFeesLoading,
    usdcFees,
    usdcFeesError,
    children,
    ...rest
  } = props
  return (
    <YStack key="review-send-amount-box" gap="$3" jc="center" {...rest}>
      <YStack gap="$4">
        <XStack gap="$2" ai="center">
          <IconCoin
            symbol={selectedCoin?.symbol ?? 'USDC'}
            size={localizedAmount.length > 10 ? '$1.5' : '$2.5'}
          />
          <SizableText size="$6" fow="500">
            {selectedCoin?.symbol}
          </SizableText>
        </XStack>
        <XStack ai={'center'} gap={'$2'} bbw={1} bbc="$gray8">
          <Text
            fontWeight={'700'}
            fontFamily="$mono"
            fontSize={localizedAmount?.length > 12 ? 32 : 40}
            lh={55}
            pb="$2"
          >
            {localizedAmount}
          </Text>
          {isPricesLoading ? (
            <Spinner size="small" color={'$color12'} />
          ) : (
            <SizableText color={'$color10'} fontSize={'$3'} fontFamily={'$mono'} mt={-1}>
              (
              {amountInUSD.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 2,
              })}
              )
            </SizableText>
          )}
        </XStack>
      </YStack>
      <YStack gap="$3">
        {children}
        <XStack ai={'center'} jc={'space-between'} gap={'$4'}>
          <SizableText col="$gray11" size="$5">
            Fees
          </SizableText>
          {isFeesLoading && <Spinner size="small" color={'$color11'} />}
          {usdcFees && (
            <SizableText size="$5" col="$gray12">
              {formatAmount(formatUnits(usdcFees.baseFee + usdcFees.gasFees, usdcFees.decimals))}{' '}
              USDC
            </SizableText>
          )}
          {usdcFeesError && (
            <SizableText col="$error">{usdcFeesError?.message?.split('.').at(0)}</SizableText>
          )}
        </XStack>
      </YStack>
    </YStack>
  )
})
