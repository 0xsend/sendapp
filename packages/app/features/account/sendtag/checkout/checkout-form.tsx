import { Button, Fade, Input, Paragraph, Separator, Spinner, XStack, YStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconX } from 'app/components/icons'
import { total } from 'app/data/sendtags'
import { usePendingTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import { useMemo, useState } from 'react'
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
import { Section } from 'app/components/layout/Section'
import { RowLabel } from 'app/components/layout/RowLabel'
import { useBalance } from 'wagmi'
import { baseMainnetClient, usdcAddress } from '@my/wagmi'
import { useSendAccount } from 'app/utils/send-accounts'
import { IconCoin } from 'app/components/icons/IconCoin'

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
  const { data: referralCode } = useReferralCode()
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
  const { data: referrer, error: referrerError } = useReferrer()
  const { data: referred, isLoading: isLoadingReferred } = api.referrals.getReferred.useQuery()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)

  switch (true) {
    case isLoadingReferred:
      return <Spinner color="$color11" />
    case !!referred:
      return null
    default:
      return (
        <Section
          borderColor={referrerError || (referralCode && !referrer) ? '$error' : 'transparent'}
          bw={1}
          $gtLg={{ p: '$7', gap: '$3.5' }}
        >
          <XStack gap="$2" position="relative" ai={'center'} jc={'space-between'}>
            <Input
              value={referralCode ?? ''}
              onChangeText={(text) => {
                mutation.mutate(text)
              }}
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
            />
            {(() => {
              switch (true) {
                case !!referrer:
                  return (
                    <Fade>
                      <Check color="$primary" size="1" $theme-light={{ color: '$color12' }} />
                    </Fade>
                  )
                case !!referralCode:
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
                        onPress={() => mutation.mutate('')}
                        p={0}
                      >
                        <Button.Text>
                          <IconX
                            color={'$primary'}
                            $theme-light={{ color: '$color12' }}
                            size="$1"
                          />
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
              case !!referrerError:
                return <Paragraph color="$error">{referrerError.message}</Paragraph>
              case !!referralCode && !referrer:
                return <Paragraph color="$error">Invalid referral code</Paragraph>
              case !!referrer:
                return <Paragraph>Referral code applied</Paragraph>
              default:
                return <Paragraph>Got a referral? Enter the code to get rewards!</Paragraph>
            }
          })()}
        </Section>
      )
  }
}

function TotalPrice() {
  const pendingTags = usePendingTags()
  const { usdcFees, usdcFeesError, isLoadingUSDCFees, isLoadingReferred, referredError } =
    useSendtagCheckout()
  const _total = useMemo(() => total(pendingTags ?? []), [pendingTags])
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])
  const chainId = baseMainnetClient.chain.id

  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
  } = useBalance({
    address: sender,
    chainId: baseMainnetClient.chain.id,
    token: usdcAddress[chainId],
  })

  return (
    <Section>
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
            {formatUnits(_total, 6)}
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
          <Paragraph size={'$5'}>{formatUnits(_total, 6)} USDC</Paragraph>
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
            case isLoadingBalance:
              return <Spinner color="$color11" />
            case !!balanceError:
              return <Paragraph color="$error">{balanceError?.message?.split('.').at(0)}</Paragraph>
            case !balance:
              return (
                <Paragraph size={'$5'} fontWeight={'500'}>
                  -
                </Paragraph>
              )
            default:
              return (
                <Paragraph size={'$5'} fontWeight={'500'}>
                  {formatUnits(balance.value, 6)} USDC
                </Paragraph>
              )
          }
        })()}
      </XStack>
    </Section>
  )
}
