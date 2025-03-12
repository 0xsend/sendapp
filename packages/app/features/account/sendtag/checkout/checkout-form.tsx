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

export const CheckoutForm = () => {
  const user = useUser()
  const router = useRouter()

  function onConfirmed() {
    console.log('Checkout confirmed, updating profile')
    user?.updateProfile()
    router.replace('/account/sendtag')
  }

  // If no pending tags, show the tag creation form
  if (!pendingTags?.length) {
    return (
      <YStack gap="$4">
        <RowLabel>Create New Tag</RowLabel>
        <YStack gap="$2">
          <Input
            value={tagName}
            onChangeText={(text) => {
              setTagName(text)
              setError(undefined)
            }}
            placeholder="Enter tag name"
          />
          {error && (
            <Paragraph color="$error" size="$2">
              {error}
            </Paragraph>
          )}
        </YStack>
        <XStack jc="flex-end">
          <Button theme="active" onPress={handleCreateTag} disabled={createTag.isPending}>
            {createTag.isPending ? (
              <XStack gap="$2" ai="center">
                <Spinner />
                <ButtonText fontSize={'$4'} fontWeight={'500'}>
                  Creating...
                </ButtonText>
              </XStack>
            ) : (
              <ButtonText fontSize={'$4'} fontWeight={'500'}>
                Create Tag
              </ButtonText>
            )}
          </Button>
        </XStack>
      </YStack>
    )
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
  const { usdcFees, usdcFeesError, isLoadingUSDCFees } = useSendtagCheckout()
  const _total = useMemo(() => total(pendingTags ?? []), [pendingTags])
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
          <Paragraph size={'$11'} fontWeight={'500'}>
            {formatAmount(formatUnits(_total, usdcCoin.decimals))}
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
          <Paragraph size={'$5'}>
            {formatAmount(formatUnits(_total, usdcCoin.decimals))} USDC
          </Paragraph>
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
              case isLoadingUSDCFees:
                return <Spinner color="$color11" />
              case !!usdcFeesError:
                return (
                  <Paragraph color="$error" textAlign={'right'}>
                    {usdcFeesError?.message?.split('.').at(0)}
                  </Paragraph>
                )
              case !usdcFees:
                return <Paragraph size={'$5'}>-</Paragraph>
              default:
                return (
                  <Paragraph size={'$5'}>
                    {formatAmount(
                      formatUnits(usdcFees.baseFee + usdcFees.gasFees, usdcFees.decimals)
                    )}{' '}
                    USDC
                  </Paragraph>
                )
            }
          })()}
        </XStack>
      </YStack>
    </FadeCard>
  )
}
