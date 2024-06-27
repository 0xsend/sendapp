import {
  AnimatePresence,
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
  useToastController,
  Theme,
} from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { CheckCheck } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import { IconCopy } from './icons'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'

export function ReferralLink(props: ButtonProps) {
  const { profile } = useUser()
  const referralCode = profile?.referral_code
  const referralHref = `https://send.app?referral=${referralCode}`
  const referralLinkVisual = `referral=${referralCode}`
  const toast = useToastController()
  const [hasCopied, setHasCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    const canShare = async () => {
      const canShare = await Sharing.isAvailableAsync()
      setCanShare(canShare)
    }
    canShare()
  }, [])

  const shareOrCopyOnPress = async () => {
    if (canShare) {
      return await Sharing.shareAsync(referralHref)
    }

    await Clipboard.setStringAsync(referralHref)
      .then(() => toast.show('Copied your referral link to the clipboard'))
      .catch(() =>
        toast.show('Something went wrong', {
          message: 'We were unable to copy your referral link to the clipboard',
          customData: {
            theme: 'red',
          },
        })
      )
  }

  useEffect(() => {
    if (hasCopied) {
      setTimeout(() => {
        setHasCopied(false)
      }, 2000)
    }
  }, [hasCopied])

  if (!referralCode) return null
  return (
    <Button
      chromeless
      hoverStyle={{
        backgroundColor: 'transparent',
        borderColor: '$transparent',
      }}
      pressStyle={{
        backgroundColor: 'transparent',
      }}
      focusStyle={{
        backgroundColor: 'transparent',
      }}
      onPress={() => {
        setHasCopied(true)
        shareOrCopyOnPress()
      }}
      {...props}
    >
      <Theme name="green">
        <ButtonText
          fontSize={'$4'}
          fontWeight={'500'}
          fontFamily={'$mono'}
          px="$2"
          bc="$background"
        >
          {referralLinkVisual}
        </ButtonText>
      </Theme>
      <ButtonIcon>
        <AnimatePresence exitBeforeEnter>
          {hasCopied ? (
            <CheckCheck
              size={16}
              $theme-dark={{ color: '$primary' }}
              $theme-light={{ color: '$color12' }}
              key="referral-link-icon"
              animation="bouncy"
              enterStyle={{
                opacity: 0,
                scale: 0.9,
              }}
              exitStyle={{
                opacity: 0,
                scale: 0.9,
              }}
            />
          ) : (
            <IconCopy
              size={16}
              $theme-dark={{ color: '$primary' }}
              $theme-light={{ color: '$color12' }}
            />
          )}
        </AnimatePresence>
      </ButtonIcon>
    </Button>
  )
}
