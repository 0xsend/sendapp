import {
  Dialog,
  H2,
  isWeb,
  Paragraph,
  PrimaryButton,
  QRCode,
  Separator,
  Sheet,
  useAppToast,
  YStack,
} from '@my/ui'
import { IconSend } from 'app/components/icons'
import { useConfirmedTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import * as Clipboard from 'expo-clipboard'
import { Platform } from 'react-native'
import { Copy } from '@tamagui/lucide-icons'

interface ShareProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareProfileDialog({ isOpen, onClose }: ShareProfileDialogProps) {
  const { profile } = useUser()
  const tags = useConfirmedTags()
  const toast = useAppToast()

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
      onClose()
    } catch {
      toast.error('Failed to copy link', {
        message: 'Something went wrong while copying the link',
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
        <PrimaryButton onPress={handleCopyLink} f={Platform.OS === 'web' ? 1 : undefined}>
          <PrimaryButton.Icon>
            <Copy size={16} color={'$black'} />
          </PrimaryButton.Icon>
          <PrimaryButton.Text>copy link</PrimaryButton.Text>
        </PrimaryButton>
        {Platform.OS === 'web' && (
          <Dialog.Close asChild>
            <PrimaryButton focusStyle={{ outlineWidth: 0 }} theme={undefined} f={1}>
              <PrimaryButton.Text>close</PrimaryButton.Text>
            </PrimaryButton>
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
      snapPoints={['fit']}
      snapPointsMode="fit"
    >
      <Sheet.Frame key="share-profile-sheet" gap="$3.5" padding="$6">
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
