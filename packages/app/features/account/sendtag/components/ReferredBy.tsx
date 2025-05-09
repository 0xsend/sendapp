import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  REFERRAL_COOKIE_MAX_AGE,
  REFERRAL_COOKIE_NAME,
  setCookie,
  useReferralCodeCookie,
} from 'app/utils/useReferralCodeCookie'
import { useReferrer } from 'app/utils/useReferrer'
import { useCallback, useEffect, useState } from 'react'
import { Button, Fade, FadeCard, Input, Paragraph, Spinner, useDebounce, XStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { IconX } from 'app/components/icons'

/**
 * Shows the referral code and the user's profile if they have one
 */
export function ReferredBy() {
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
  const { data: referrer, error: referrerError, isLoading: isReferrerLoading } = useReferrer()
  const { data: referralCodeCookie, isLoading: isReferralCodeCookieLoading } =
    useReferralCodeCookie()

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
    if (!isReferrerLoading && referrer) {
      const ref = referrer.tag && referrer.tag !== '' ? referrer.tag : referrer.refcode
      setReferralCode(ref)
    }
  }, [referrer, isReferrerLoading])

  return (
    <FadeCard
      borderColor={
        referrerError || Boolean(referrerError) || (!isReferrerLoading && referralCode && !referrer)
          ? '$error'
          : 'transparent'
      }
      bw={1}
      $gtLg={{ p: '$7', gap: '$3.5' }}
    >
      <XStack gap="$2" position="relative" ai={'center'} jc={'space-between'}>
        <Input
          disabled={!!referrer && !referrer.isNew}
          disabledStyle={{ opacity: 0.5 }}
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
            case isReferrerLoading ||
              isReferralCodeCookieLoading ||
              referralCode !== referralCodeCookie:
              return <Spinner color="$color11" />
            case !!referrer:
              return (
                <Fade>
                  <Check color="$primary" size="$1" $theme-light={{ color: '$color12' }} />
                </Fade>
              )
            case !!referrer && referrer.isNew && !!referralCode:
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
          backgroundColor={isInputFocused ? '$primary' : '$darkGrayTextField'}
          $theme-light={{
            backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
          }}
        />
      </XStack>
      {(() => {
        switch (true) {
          case referralCode === '':
            return <Paragraph>Got a referral? Enter the code to get rewards!</Paragraph>
          case isReferrerLoading:
            return <Paragraph>Validating referral code</Paragraph>
          case !!referrerError:
            return <Paragraph color="$error">{referrerError.message}</Paragraph>
          case !isReferrerLoading && !referrer && referralCode === referralCodeCookie:
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
