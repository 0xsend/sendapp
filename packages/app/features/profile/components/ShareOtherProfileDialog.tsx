import { Button, Dialog, Image, isWeb, Paragraph, Separator, useAppToast, YStack } from '@my/ui'
import { IconCopy } from 'app/components/icons'
import type { Functions } from '@my/supabase/database.types'
import * as Clipboard from 'expo-clipboard'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

interface ShareOtherProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  profile: Functions<'profile_lookup'>[number] | null | undefined
}

export function ShareOtherProfileDialog({
  isOpen,
  onClose,
  profile,
}: ShareOtherProfileDialogProps) {
  const toast = useAppToast()
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')

  const hostname = isWeb ? window.location.hostname : 'send.app'
  const sendtag = profile?.main_tag_name

  const profileUrl = sendtag
    ? `https://${hostname}/${sendtag}`
    : `https://${hostname}/profile/${profile?.sendid}`

  useEffect(() => {
    if (isOpen && profileUrl && profile) {
      QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeDataURL)
        .catch((e) => {
          console.error(e)
          toast.error('Failed to create QR code', {
            message: 'Something went wrong while creating QR code',
          })
          setQrCodeDataURL('')
        })
    }
  }, [isOpen, profileUrl, profile, toast.error])

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(profileUrl)
      toast.show('Profile link copied to clipboard')
    } catch {
      toast.error('Failed to copy link', {
        message: 'Something went wrong while copying the link',
      })
    }
  }

  if (!profile) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          width={'85%'}
          br={'$5'}
          p={'$5'}
          gap={'$3.5'}
          maxWidth={400}
          $gtLg={{ p: '$7', gap: '$5' }}
        >
          <Paragraph size={'$8'} fontWeight={500}>
            {profile.name ? `Share ${profile.name}'s Profile` : 'Share Profile'}
          </Paragraph>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />

          {qrCodeDataURL && (
            <YStack ai={'center'} gap={'$3'}>
              <Image source={{ uri: qrCodeDataURL }} width={200} height={200} br={'$3'} />
              <Paragraph size={'$4'} color={'$color10'} ta={'center'} numberOfLines={1}>
                {profileUrl}
              </Paragraph>
            </YStack>
          )}
          <YStack
            justifyContent="space-between"
            marginTop="$4"
            gap="$4"
            $gtLg={{ flexDirection: 'row-reverse' }}
          >
            <Button
              theme="green"
              borderRadius={'$4'}
              p={'$4'}
              onPress={handleCopyLink}
              focusStyle={{ outlineWidth: 0 }}
            >
              <Button.Icon>
                <IconCopy size={16} color={'$black'} />
              </Button.Icon>
              <Button.Text
                ff={'$mono'}
                fontWeight={'500'}
                tt="uppercase"
                size={'$5'}
                color={'$black'}
                ml={'$2'}
              >
                copy link
              </Button.Text>
            </Button>
            <Dialog.Close asChild>
              <Button borderRadius={'$4'} p={'$4'} focusStyle={{ outlineWidth: 0 }}>
                <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
                  close
                </Button.Text>
              </Button>
            </Dialog.Close>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
