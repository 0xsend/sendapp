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
import { useUser } from 'app/utils/useUser'
import * as Clipboard from 'expo-clipboard'
import { Platform } from 'react-native'
import { Copy } from '@tamagui/lucide-icons'
import { memo, useMemo, useCallback } from 'react'

interface ShareProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const ShareProfileDialog = memo<ShareProfileDialogProps>(function ShareProfileDialog({
  isOpen,
  onClose,
}) {
  const { profile } = useUser()
  const toast = useAppToast()

  const sendtag = useMemo(() => profile?.main_tag?.name, [profile?.main_tag?.name])
  const hostname = useMemo(() => (isWeb ? window.location.hostname : 'send.app'), [])
  const profileUrl = useMemo(() => {
    if (!profile?.send_id) return ''
    return sendtag
      ? `https://${hostname}/${sendtag}`
      : `https://${hostname}/profile/${profile.send_id}`
  }, [sendtag, hostname, profile?.send_id])

  const handleCopyLink = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(profileUrl)
      toast.show('Profile link copied to clipboard')
      onClose()
    } catch {
      toast.error('Failed to copy link', {
        message: 'Something went wrong while copying the link',
      })
    }
  }, [profileUrl, toast.show, onClose, toast.error])

  const icons = useMemo(
    () => ({
      send: <IconSend size={'$5'} />,
      copy: <Copy size={16} color={'$black'} />,
    }),
    []
  )

  if (!isOpen) return null

  const dialogContent = (
    <>
      <H2 size={'$8'} fontWeight={500}>
        Share Profile
      </H2>
      <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
      {profileUrl && (
        <YStack ai={'center'} gap={'$3'}>
          <QRCode value={profileUrl} size={240} centerComponent={icons.send} />
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
          <PrimaryButton.Icon>{icons.copy}</PrimaryButton.Icon>
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
})
