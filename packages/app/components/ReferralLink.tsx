import {
  AnimatePresence,
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
  Paragraph,
  useAppToast,
  XStack,
} from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { CheckCheck, Copy } from '@tamagui/lucide-icons'
import { useEffect, useState, memo, useMemo, useCallback } from 'react'
import * as Clipboard from 'expo-clipboard'

export const ReferralLink = memo<ButtonProps>(function ReferralLink(props) {
  const { profile } = useUser()
  const toast = useAppToast()
  const [hasCopied, setHasCopied] = useState(false)

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
          animation="bouncy"
          flexShrink={0}
          enterStyle={{
            opacity: 0,
            scale: 0.9,
          }}
          exitStyle={{
            opacity: 0,
            scale: 0.9,
          }}
        />
      ),
    }),
    []
  )

  const copyAndMaybeShareOnPress = useCallback(async () => {
    await Clipboard.setStringAsync(referralHref)
      .then(() => toast.show('Copied your referral link to the clipboard'))
      .catch(() =>
        toast.error('Something went wrong', {
          message: 'We were unable to copy your referral link to the clipboard',
        })
      )
  }, [referralHref, toast.show, toast.error])

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
          Send ID:
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
          Referral Code:
        </ButtonText>
        <ButtonText
          fontSize={'$5'}
          fontWeight={'500'}
          bc="transparent"
          maxWidth={'85%'}
          hoverStyle={{
            color: '$primary',
          }}
        >
          {referralCode}
        </ButtonText>
        <ButtonIcon>
          <AnimatePresence exitBeforeEnter>
            {hasCopied ? icons.checkCheck : icons.copy}
          </AnimatePresence>
        </ButtonIcon>
      </Button>
    </XStack>
  )
})
