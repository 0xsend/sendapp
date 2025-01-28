import {
  AnimatePresence,
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
  Paragraph,
  useToastController,
  XStack,
} from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { CheckCheck } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import { IconCopy } from './icons'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'

export function ReferralLink(props: ButtonProps) {
  const { profile, tags } = useUser()
  const referralCode = tags?.[0]?.name || profile?.referral_code
  const referralHref = `https://send.app?referral=${referralCode}`
  const referralLinkVisual = `send.app/${referralCode}`
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

  const copyAndMaybeShareOnPress = async () => {
    await Clipboard.setStringAsync(referralHref)
      .then(() => toast.show('Copied your referral link to the clipboard'))
      .then(() => (canShare ? Sharing.shareAsync(referralHref).catch(() => null) : null))
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
    <XStack ai={'center'} gap={'$2'} width={'100%'}>
      <Paragraph size={'$4'} color={'$color10'}>
        Referral:
      </Paragraph>
      <Button
        chromeless
        flex={1}
        jc={'flex-start'}
        height={'auto'}
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
          copyAndMaybeShareOnPress()
        }}
        {...props}
      >
        <ButtonText
          fontSize={'$5'}
          fontWeight={'500'}
          fontFamily={'$mono'}
          bc="$background"
          maxWidth={'85%'}
          hoverStyle={{
            color: '$primary',
          }}
        >
          {referralLinkVisual}
        </ButtonText>
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
    </XStack>
  )
}
