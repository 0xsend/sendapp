import { FadeCard, Paragraph, Separator, Spinner, XStack, YStack } from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import { RowLabel } from 'app/components/layout/RowLabel'
import { usdcCoin } from 'app/data/coins'
import { total } from 'app/data/sendtags'
import { useCoin } from 'app/provider/coins'
import formatAmount from 'app/utils/formatAmount'
import { usePendingTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import { useMemo } from 'react'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'
import { useSendtagCheckout } from './checkout-utils'
import { ConfirmButton } from './components/checkout-confirm-button'
import { ReferredBy } from 'app/features/account/sendtag/components/ReferredBy'
import { Platform } from 'react-native'

export const CheckoutForm = () => {
  const user = useUser()
  const router = useRouter()

  function onConfirmed() {
    user?.updateProfile()

    if (Platform.OS === 'web') {
      router.replace('/account/sendtag')
      return
    }

    router.back()
    router.back()
  }

  // Show checkout UI when we have pending tags
  return (
    <>
      <YStack gap="$5">
        <YStack gap={'$3.5'}>
          <RowLabel>Review purchase</RowLabel>
          <TotalPrice />
        </YStack>
        <ReferredBy />
      </YStack>
      <ConfirmButton onConfirmed={onConfirmed} />
    </>
  )
}

function TotalPrice() {
  const pendingTags = usePendingTags()
  const { fees, feesError, isLoadingFees } = useSendtagCheckout()
  const _total = useMemo(() => total(pendingTags ?? []), [pendingTags])
  const { coin: usdc, isLoading: isCoinLoading } = useCoin('USDC')

  return (
    <FadeCard>
      <YStack gap={'$2'}>
        <Paragraph
          size={'$5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Total Price
        </Paragraph>
        <XStack jc={'space-between'} ai={'center'}>
          <Paragraph size={'$11'} fontWeight={'500'} lineHeight={50}>
            {formatUnits(_total, usdcCoin.decimals)}
          </Paragraph>
          <XStack ai={'center'} gap={'$2'}>
            <IconCoin symbol={'USDC'} size={'$2'} />
            <Paragraph size={'$7'}>USDC</Paragraph>
          </XStack>
        </XStack>
      </YStack>
      <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
      <YStack gap={'$2'}>
        <XStack jc={'space-between'} ai={'center'}>
          <Paragraph
            size={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Price
          </Paragraph>
          <Paragraph size={'$5'}>{formatUnits(_total, usdcCoin.decimals)} USDC</Paragraph>
        </XStack>
        <XStack jc={'space-between'} ai={'center'} gap={'$3'}>
          <Paragraph
            size={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Fees
          </Paragraph>
          {(() => {
            switch (true) {
              case isLoadingFees:
                return <Spinner color="$color11" />
              case !!feesError:
                return (
                  <Paragraph color="$error" textAlign={'right'}>
                    {feesError?.message?.split('.').at(0)}
                  </Paragraph>
                )
              case !fees:
                return <Paragraph size={'$5'}>-</Paragraph>
              default:
                return (
                  <Paragraph size={'$5'}>
                    {formatAmount(formatUnits(fees.totalFee, fees.decimals))} USDC
                  </Paragraph>
                )
            }
          })()}
        </XStack>
      </YStack>
      <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
      <XStack gap={'$2'} ai={'center'}>
        <Paragraph
          size={'$5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Balance:
        </Paragraph>
        {(() => {
          switch (true) {
            case isCoinLoading:
              return <Spinner color="$color11" />
            case !isCoinLoading && !usdc:
              return <Paragraph color="$error">Error fetching balance info</Paragraph>
            case !usdc?.balance:
              return (
                <Paragraph size={'$5'} fontWeight={'500'}>
                  -
                </Paragraph>
              )
            default:
              return (
                <Paragraph size={'$5'} fontWeight={'500'}>
                  {formatAmount(
                    formatUnits(usdc.balance, usdcCoin.decimals),
                    12,
                    usdcCoin.formatDecimals
                  )}{' '}
                  USDC
                </Paragraph>
              )
          }
        })()}
      </XStack>
    </FadeCard>
  )
}
