import {
  Button,
  Fade,
  FadeCard,
  Input,
  Paragraph,
  Separator,
  Spinner,
  useDebounce,
  XStack,
  YStack,
} from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconX } from 'app/components/icons'
import { total } from 'app/data/sendtags'
import { usePendingTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'
import {
  REFERRAL_COOKIE_MAX_AGE,
  REFERRAL_COOKIE_NAME,
  setCookie,
  useReferralCode,
  useReferrer,
  useSendtagCheckout,
} from './checkout-utils'
import { ConfirmButton } from './components/checkout-confirm-button'
import formatAmount from 'app/utils/formatAmount'
import { api } from 'app/utils/api'
import { RowLabel } from 'app/components/layout/RowLabel'
import { IconCoin } from 'app/components/icons/IconCoin'
import { usdcCoin } from 'app/data/coins'
import { useCoin } from 'app/provider/coins'

export const CheckoutForm = () => {
  const user = useUser()
  const router = useRouter()

  function onConfirmed() {
    user?.updateProfile()
    router.replace('/account/sendtag')
  }

  return (
    <>
      <YStack gap={'$3.5'}>
        <RowLabel>Review purchase</RowLabel>
        <TotalPrice />
      </YStack>
      <ReferredBy />
      <ConfirmButton onConfirmed={onConfirmed} />
    </>
  )
}

/**
 * Shows the referral code and the user's profile if they have one
 */
function ReferredBy() {
  const { data: referralCodeFromCookie, isLoading: isLoadingReferralCodeFromCookie } =
    useReferralCode()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (newReferralCode: string) => {
      setCookie(REFERRAL_COOKIE_NAME, newReferralCode, REFERRAL_COOKIE_MAX_AGE)
      return Promise.resolve(newReferralCode)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralCode'] })
    },
  })
  const { data: referrer, error: referrerError, isLoading: isLoadingReferrer } = useReferrer()
  const { data: referred, isLoading: isLoadingReferred } = api.referrals.getReferred.useQuery()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [referralCode, setReferralCode] = useState<string>('')

  const updateReferralCodeCookie = useDebounce(
    useCallback(
      (text: string) => {
        mutation.mutate(text)
      },
      [mutation.mutate]
    ),
    300,
    { leading: false },
    []
  )

  useEffect(() => {
    updateReferralCodeCookie(referralCode)
  }, [referralCode, updateReferralCodeCookie])

  useEffect(() => {
    if (!isLoadingReferralCodeFromCookie && referralCodeFromCookie) {
      setReferralCode(referralCodeFromCookie)
    }
  }, [isLoadingReferralCodeFromCookie, referralCodeFromCookie])

  if (isLoadingReferred) {
    return <Spinner color="$color11" />
  }

  if (referred) {
    return null
  }

  return (
    <FadeCard
      borderColor={
        referrerError || (referralCodeFromCookie && referralCode && !referrer && !isLoadingReferrer)
          ? '$error'
          : 'transparent'
      }
      bw={1}
      $gtLg={{ p: '$7', gap: '$3.5' }}
    >
      <XStack gap="$2" position="relative" ai={'center'} jc={'space-between'}>
        <Input
          value={referralCode}
          onChangeText={(text) => setReferralCode(text)}
          placeholder={'Referral Code'}
          col={'$color12'}
          bw={0}
          br={0}
          p={0}
          w={'80%'}
          focusStyle={{
            outlineWidth: 0,
          }}
          $theme-dark={{
            placeholderTextColor: '$darkGrayTextField',
          }}
          $theme-light={{
            placeholderTextColor: '$darkGrayTextField',
          }}
          fontSize={'$5'}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          testID={'referral-code-input'}
        />
        {(() => {
          switch (true) {
            case isLoadingReferrer:
              return <Spinner color="$color11" />
            case !!referrer:
              return (
                <Fade>
                  <Check color="$primary" size="1" $theme-light={{ color: '$color12' }} />
                </Fade>
              )
            case !!referralCodeFromCookie && !!referralCode:
              return (
                <Fade>
                  <Button
                    chromeless
                    backgroundColor="transparent"
                    hoverStyle={{ backgroundColor: 'transparent' }}
                    pressStyle={{
                      backgroundColor: 'transparent',
                      borderColor: 'transparent',
                    }}
                    focusStyle={{ backgroundColor: 'transparent' }}
                    onPress={() => setReferralCode('')}
                    p={0}
                  >
                    <Button.Text>
                      <IconX color={'$primary'} $theme-light={{ color: '$color12' }} size="$1" />
                    </Button.Text>
                  </Button>
                </Fade>
              )
            default:
              return null
          }
        })()}
        <XStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          height={1}
          backgroundColor={isInputFocused ? '$primary' : '$silverChalice'}
          $theme-light={{
            backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
          }}
        />
      </XStack>
      {(() => {
        switch (true) {
          case isLoadingReferrer:
            return <Paragraph>Validating referral code</Paragraph>
          case !!referrerError:
            return <Paragraph color="$error">{referrerError.message}</Paragraph>
          case !!referralCodeFromCookie && !!referralCode && !referrer:
            return <Paragraph color="$error">Invalid referral code</Paragraph>
          case !!referrer:
            return <Paragraph>Referral code applied</Paragraph>
          default:
            return <Paragraph>Got a referral? Enter the code to get rewards!</Paragraph>
        }
      })()}
    </FadeCard>
  )
}

function TotalPrice() {
  const pendingTags = usePendingTags()
  const { usdcFees, usdcFeesError, isLoadingUSDCFees, isLoadingReferred, referredError } =
    useSendtagCheckout()
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
          <Paragraph size={'$11'} fontWeight={'500'}>
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
              case isLoadingUSDCFees || isLoadingReferred:
                return <Spinner color="$color11" />
              case !!usdcFeesError:
                return (
                  <Paragraph color="$error" textAlign={'right'}>
                    {usdcFeesError?.message?.split('.').at(0)}
                  </Paragraph>
                )
              case !!referredError:
                return (
                  <Paragraph color="$error" textAlign={'right'}>
                    {referredError?.message?.split('.').at(0)}
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
