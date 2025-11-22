import {
  Button,
  Dialog,
  H2,
  isWeb,
  Paragraph,
  PrimaryButton,
  QRCode,
  Sheet,
  useAppToast,
  View,
  XStack,
  YStack,
} from '@my/ui'
import { IconSend } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import * as Clipboard from 'expo-clipboard'
import { Platform } from 'react-native'
import { Copy, X } from '@tamagui/lucide-icons'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('account')

  const sendtag = profile?.main_tag?.name
  const hostname = isWeb ? window.location.hostname : 'send.app'

  const profileUrl = !profile?.send_id
    ? ''
    : sendtag
      ? `https://${hostname}/${sendtag}`
      : `https://${hostname}/profile/${profile.send_id}`

  const handleCopyLink = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(profileUrl)
      toast.show(t('share.toast.copied'))
      onClose()
    } catch {
      toast.error(t('share.toast.copyError.title'), {
        message: t('share.toast.copyError.message'),
      })
    }
  }, [profileUrl, toast, onClose, t])

  const dialogContent = (
    <YStack ai="stretch">
      <XStack jc="space-between" mx="$-4" mt="$-4" p="$3" pb="$2" pl="$4">
        <H2 size="$8" fontWeight={400}>
          {t('share.title')}
        </H2>
        <Button
          onPress={onClose}
          size="$3"
          circular
          x={4}
          y={-4}
          pressStyle={{
            scale: 0.9,
          }}
          animation="100ms"
          animateOnly={['transform']}
          elevate={isWeb}
        >
          <X scale={0.8} col="$aztec11" />
        </Button>
      </XStack>
      <View mx="$-4" h={1} bg="$aztec6" $theme-light={{ bg: '$gray7' }} />
      <YStack>
        {profileUrl && (
          <YStack ai="center" gap="$3" pt="$3">
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
            <PrimaryButton.Text>{t('share.actions.copy')}</PrimaryButton.Text>
          </PrimaryButton>
        </YStack>
      </YStack>
    </YStack>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          animation="smoothResponsive"
          animateOnly={['opacity']}
          opacity={0.7}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          animation="smoothResponsive"
          key="share-profile-dialog-content"
          animateOnly={['transform', 'opacity']}
          enterStyle={{ x: 0, y: -100, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: -100, opacity: 0, scale: 0.95 }}
          width="85%"
          br="$8"
          gap="$3.5"
          p="$4"
          px="$4"
          maxWidth={400}
        >
          {dialogContent}
        </Dialog.Content>
      </Dialog.Portal>

      <Dialog.Adapt platform="native">
        <Dialog.Sheet
          modal
          dismissOnSnapToBottom
          dismissOnOverlayPress
          native
          snapPoints={['fit']}
          snapPointsMode="fit"
          animation="smoothResponsive"
        >
          <Dialog.Sheet.Frame key="share-profile-sheet" gap="$3.5" padding="$4">
            <Dialog.Adapt.Contents />
          </Dialog.Sheet.Frame>
          <Sheet.Overlay
            animation="300ms"
            animateOnly={['opacity']}
            opacity={0.7}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Dialog.Sheet>
      </Dialog.Adapt>
    </Dialog>
  )
})
