import {
  AnimatePresence,
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
  Paragraph,
  useAppToast,
  View,
  XStack,
} from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { CheckCheck, Copy } from '@tamagui/lucide-icons'
import { useEffect, useState, memo, useMemo, useCallback } from 'react'
import * as Clipboard from 'expo-clipboard'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from 'app/provider/analytics'

export const ReferralLink = memo<ButtonProps>(function ReferralLink(props) {
  const { profile } = useUser()
  const toast = useAppToast()
  const [hasCopied, setHasCopied] = useState(false)
  const { t } = useTranslation('affiliate')
  const analytics = useAnalytics()

  const send_id = useMemo(() => profile?.send_id, [profile?.send_id])
  const referralCode = useMemo(() => profile?.main_tag?.name, [profile?.main_tag?.name])
  const referralHref = useMemo(
    () => (referralCode ? `https://send.app?referral=${referralCode}` : ''),
    [referralCode]
  )

  const icons = useMemo(
    () => ({
      copy: (
        <Copy size={16} flexShrink={0} color={'$primary'} $theme-light={{ color: '$color12' }} />
      ),
      checkCheck: (
        <CheckCheck
          size={16}
          color={'$primary'}
          $theme-light={{ color: '$color12' }}
          key="referral-link-icon"
          flexShrink={0}
        />
      ),
    }),
    []
  )

  const copyAndMaybeShareOnPress = useCallback(async () => {
    await Clipboard.setStringAsync(referralHref)
      .then(() => {
        toast.show(t('referralLink.toast.copied'))

        // Track referral link shared
        analytics.capture({
          name: 'referral_link_shared',
          properties: {
            channel: 'copy_link',
          },
        })
      })
      .catch(() =>
        toast.error(t('referralLink.toast.errorTitle'), {
          message: t('referralLink.toast.errorMessage'),
        })
      )
  }, [referralHref, t, toast, analytics])

  const handlePress = useCallback(
    (e) => {
      e.preventDefault()
      setHasCopied(true)
      void copyAndMaybeShareOnPress()
    },
    [copyAndMaybeShareOnPress]
  )

  useEffect(() => {
    if (hasCopied) {
      const timeoutId = setTimeout(() => {
        setHasCopied(false)
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [hasCopied])

  if (!referralCode) {
    return (
      <XStack ai={'center'} gap={'$2'} width={'100%'}>
        <Paragraph size={'$5'} color={'$color10'}>
          {t('referralLink.labels.sendId')}
        </Paragraph>
        <Paragraph fontSize={'$5'} fontWeight={'500'}>
          {send_id}
        </Paragraph>
      </XStack>
    )
  }

  return (
    <XStack ai={'center'} gap={'$2'} width={'100%'}>
      <Button
        chromeless
        height={'auto'}
        bw={0}
        hoverStyle={{
          backgroundColor: '$backgroundTransparent',
        }}
        pressStyle={{
          backgroundColor: 'transparent',
        }}
        focusStyle={{
          backgroundColor: 'transparent',
        }}
        onPress={handlePress}
        flexWrap="wrap"
        {...props}
      >
        <ButtonText size={'$5'} color={'$color10'} flexShrink={0}>
          {t('referralLink.labels.referralCode')}
        </ButtonText>
        <ButtonText
          fontSize={'$5'}
          fontWeight={'500'}
          bc="transparent"
          maxWidth={'85%'}
          hoverStyle={{
            opacity: 0.6,
          }}
        >
          {referralCode}
        </ButtonText>
        <ButtonIcon>
          <AnimatePresence exitBeforeEnter>
            <View
              key={hasCopied ? 'check-check' : 'copy'}
              animation="100ms"
              enterStyle={{
                opacity: 0,
                scale: 0.5,
              }}
              exitStyle={{
                opacity: 0,
                scale: 0.5,
              }}
            >
              {hasCopied ? icons.checkCheck : icons.copy}
            </View>
          </AnimatePresence>
        </ButtonIcon>
      </Button>
    </XStack>
  )
})
