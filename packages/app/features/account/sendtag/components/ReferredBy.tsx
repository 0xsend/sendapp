import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useReferrer } from 'app/utils/useReferrer'
import { useCallback, useEffect, useState } from 'react'
import { Button, Fade, FadeCard, Input, Paragraph, Spinner, useDebounce, XStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { IconX } from 'app/components/icons'
import { useReferralCodeQuery, useSetReferralCode } from 'app/utils/useReferralCode'
import { useTranslation } from 'react-i18next'

/**
 * Shows the referral code and the user's profile if they have one
 */
export function ReferredBy() {
  const queryClient = useQueryClient()
  const { mutateAsync: setReferralCodeMutateAsync } = useSetReferralCode()
  const mutation = useMutation({
    mutationFn: async (newReferralCode: string) => {
      await setReferralCodeMutateAsync(newReferralCode)
      return newReferralCode
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['referralCode'] })
    },
  })
  const { data: referrer, error: referrerError, isLoading: isReferrerLoading } = useReferrer()
  const { data: referralCodeFromStorage, isLoading: isLoadingReferralCodeFromStorage } =
    useReferralCodeQuery()

  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const { t } = useTranslation('account')

  const updateReferralCodeInStorage = useDebounce(
    useCallback(
      (text: string) => {
        mutation.mutate(text)
      },
      [mutation]
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
    if (!isReferrerLoading && referrer) {
      const ref = referrer.tag && referrer.tag !== '' ? referrer.tag : referrer.refcode
      if (ref) {
        setReferralCode(ref)
      }
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
          value={referralCode || ''}
          onChangeText={(text) => setReferralCode(text)}
          placeholder={t('sendtag.referral.placeholder')}
          lineHeight={20}
          col={'$color12'}
          bw={0}
          br={0}
          p={0}
          w={'80%'}
          focusStyle={{
            outlineWidth: 0,
          }}
          placeholderTextColor={'$color4'}
          fontSize={'$5'}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          testID={'referral-code-input'}
        />
        {(() => {
          switch (true) {
            case isReferrerLoading ||
              isLoadingReferralCodeFromStorage ||
              (referralCode !== null && referralCode !== referralCodeFromStorage):
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
            return <Paragraph>{t('sendtag.referral.empty')}</Paragraph>
          case isReferrerLoading:
            return <Paragraph>{t('sendtag.referral.validating')}</Paragraph>
          case !!referrerError:
            return <Paragraph color="$error">{referrerError.message}</Paragraph>
          case !isReferrerLoading &&
            !referrer &&
            referralCode !== null &&
            referralCode === referralCodeFromStorage:
            return <Paragraph color="$error">{t('sendtag.referral.invalid')}</Paragraph>
          case !!referrer:
            return <Paragraph>{t('sendtag.referral.applied')}</Paragraph>
          default:
            return <Paragraph>{t('sendtag.referral.empty')}</Paragraph>
        }
      })()}
    </FadeCard>
  )
}
