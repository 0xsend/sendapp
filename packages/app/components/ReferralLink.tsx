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
import { useConfirmedTags } from 'app/utils/tags'

export function ReferralLink(props: ButtonProps) {
  const { profile } = useUser()
  const send_id = profile?.send_id
  const tags = useConfirmedTags()
  const referralCode = tags?.[0]?.name
  const referralHref = `https://send.app?referral=${referralCode}`
  const toast = useToastController()
  const [hasCopied, setHasCopied] = useState(false)

  const copyAndMaybeShareOnPress = async () => {
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
      <Paragraph size={'$5'} color={'$color10'} flexShrink={0}>
        Referral Code:
      </Paragraph>
      <Button
        chromeless
        flex={1}
        jc={'space-between'}
        height={'auto'}
        hoverStyle={{
          backgroundColor: '$backgroundTransparent',
          borderColor: '$colorTransparent',
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
          bc="$background"
          maxWidth={'85%'}
          hoverStyle={{
            color: '$primary',
          }}
        >
          {referralCode}
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
            ) : (
              <IconCopy
                size={16}
                flexShrink={0}
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
