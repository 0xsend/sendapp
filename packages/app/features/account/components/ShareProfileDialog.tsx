import { Button, Dialog, Image, isWeb, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { useConfirmedTags } from 'app/utils/tags'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import * as Clipboard from 'expo-clipboard'
import { useToastController } from '@my/ui'
import { IconCopy } from 'app/components/icons'

interface ShareProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareProfileDialog({ isOpen, onClose }: ShareProfileDialogProps) {
  const { profile } = useUser()
  const tags = useConfirmedTags()
  const toast = useToastController()
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')

  // Use sendtag if available, otherwise fall back to send_id
  const sendtag = tags?.[0]?.name
  const hostname = isWeb ? window.location.hostname : 'send.app'
  const profileUrl = sendtag
    ? `https://${hostname}/${sendtag}`
    : `https://${hostname}/profile/${profile?.send_id}`

  useEffect(() => {
    if (isOpen && profileUrl) {
      QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeDataURL)
        .catch(() => setQrCodeDataURL(''))
    }
  }, [isOpen, profileUrl])

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(profileUrl)
      toast.show('Profile link copied to clipboard')
    } catch {
      toast.show('Failed to copy link', {
        message: 'Something went wrong while copying the link',
        customData: {
          theme: 'red',
        },
      })
    }
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
            Share Profile
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
