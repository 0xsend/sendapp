import {
  Button,
  Dialog,
  H2,
  isWeb,
  Paragraph,
  QRCode,
  Separator,
  Sheet,
  useToastController,
  YStack,
} from '@my/ui'
import { IconCopy, IconSend } from 'app/components/icons'
import { useConfirmedTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import * as Clipboard from 'expo-clipboard'
import { Platform } from 'react-native'

interface ShareProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareProfileDialog({ isOpen, onClose }: ShareProfileDialogProps) {
  const { profile } = useUser()
  const tags = useConfirmedTags()
  const toast = useToastController()

  // Use sendtag if available, otherwise fall back to send_id
  const sendtag = tags?.[0]?.name
  const hostname = isWeb ? window.location.hostname : 'send.app'
  const profileUrl = sendtag
    ? `https://${hostname}/${sendtag}`
    : `https://${hostname}/profile/${profile?.send_id}`

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

  // Shared content component to avoid duplication
  const dialogContent = (
    <>
      <H2 size={'$8'} fontWeight={500}>
        Share Profile
      </H2>
      <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
      {profileUrl && (
        <YStack ai={'center'} gap={'$3'}>
          <QRCode value={profileUrl} size={240} centerComponent={<IconSend size={'$5'} />} />
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
        {Platform.OS === 'web' && (
          <Dialog.Close asChild>
            <Button borderRadius={'$4'} p={'$4'} focusStyle={{ outlineWidth: 0 }}>
              <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
                close
              </Button.Text>
            </Button>
          </Dialog.Close>
        )}
      </YStack>
    </>
  )

  // Web version using Dialog
  if (Platform.OS === 'web') {
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
            {dialogContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    )
  }

  // Native version using Sheet
  return (
    <Sheet
      open={isOpen}
      onOpenChange={onClose}
      modal
      dismissOnSnapToBottom
      dismissOnOverlayPress
      native
      snapPoints={[65]}
    >
      <Sheet.Frame key="share-profile-sheet" gap="$3.5" padding="$5">
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
