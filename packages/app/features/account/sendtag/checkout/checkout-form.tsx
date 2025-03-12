import {
  Button,
  Input,
  Paragraph,
  Separator,
  Spinner,
  XStack,
  YStack,
  useDebounce,
  Fade,
  FadeCard,
  ButtonText,
} from '@my/ui'

import { Check } from '@tamagui/lucide-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconX } from 'app/components/icons'
import { total } from 'app/data/sendtags'
import { usePendingTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import { useCallback, useEffect, useState, useMemo } from 'react'
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
import { CheckoutTagSchema } from './CheckoutTagSchema'

export const CheckoutForm = () => {
  const user = useUser()
  const router = useRouter()
  const pendingTags = usePendingTags()
  const [tagName, setTagName] = useState('')
  const [error, setError] = useState<string>()
  const queryClient = useQueryClient()

  const createTag = api.tag.create.useMutation({
    onSuccess: async () => {
      // Clear the input after successful creation
      setTagName('')
      setError(undefined)

      // Invalidate and refetch relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user'] }),
        queryClient.invalidateQueries({ queryKey: ['tags'] }),
        user?.updateProfile(),
      ])

      console.log('Tag created successfully, queries invalidated')
    },
    onError: (err) => {
      console.error('Error creating tag:', err)
      setError(err.message)
    },
  })

  // Add some debug logs
  useEffect(() => {
    console.log('Form State:', {
      tagName,
      error,
      pendingTags,
      isCreatingTag: createTag.isPending,
      createTagError: createTag.error,
    })
  }, [tagName, error, pendingTags, createTag.isPending, createTag.error])

  const handleCreateTag = async () => {
    try {
      console.log('Creating tag:', tagName)
      const result = CheckoutTagSchema.safeParse({ name: tagName })
      if (!result.success) {
        setError(result.error.errors[0]?.message || 'Invalid tag name')
        return
      }

      await createTag.mutateAsync({ name: tagName })
    } catch (err) {
      console.error('Failed to create tag:', err)
      setError(err.message)
    }
  }

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
    </FadeCard>
  )
}
