import { Button, Fade, FadeCard, Input, Paragraph, Spinner, useDebounce, XStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconX } from 'app/components/icons'
import { useCallback, useEffect, useState } from 'react'
import { useReferredBy, useReferrer } from 'app/utils/referrer'
import { useReferralCodeQuery, useSetReferralCode } from 'app/utils/useReferralCode'

/**
 * Shows the referral code and the user's profile if they have one
 */
export function ReferredBy() {
  const { data: referralCodeFromStorage, isLoading: isLoadingReferralCodeFromStorage } =
    useReferralCodeQuery()
  const { mutateAsync: setReferralCodeMutateAsync } = useSetReferralCode()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (newReferralCode: string) => {
      await setReferralCodeMutateAsync(newReferralCode)
      return newReferralCode
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralCode'] })
    },
  })
  const { data: referrer, error: referrerError, isLoading: isLoadingReferrer } = useReferrer()
  const { data: referredBy, isLoading: isLoadingReferredBy } = useReferredBy()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  const updateReferralCodeInStorage = useDebounce(
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
    if (referralCode === null) {
      return
    }
    updateReferralCodeInStorage(referralCode)
  }, [referralCode, updateReferralCodeInStorage])

  useEffect(() => {
    if (!isLoadingReferralCodeFromStorage && referralCodeFromStorage) {
      setReferralCode(referralCodeFromStorage)
    }
  }, [isLoadingReferralCodeFromStorage, referralCodeFromStorage])

  if (isLoadingReferredBy) {
    return <Spinner color="$color11" />
  }

  if (referredBy) {
    return null
  }

  return (
    <FadeCard
      borderColor={
        referrerError ||
        (referralCodeFromStorage && referralCode && !referrer && !isLoadingReferrer)
          ? '$error'
          : 'transparent'
      }
      bw={1}
      $gtLg={{ p: '$7', gap: '$3.5' }}
    >
      <XStack gap="$2" position="relative" ai={'center'} jc={'space-between'}>
        <Input
          value={referralCode || ''}
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
                  <Check color="$primary" size="$1" $theme-light={{ color: '$color12' }} />
                </Fade>
              )
            case !!referralCodeFromStorage && !!referralCode:
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
          case !!referralCodeFromStorage && !!referralCode && !referrer:
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
