import {
  Button,
  Dialog,
  isWeb,
  Paragraph,
  PrimaryButton,
  QRCode,
  Separator,
  useAppToast,
  YStack,
} from '@my/ui'
import { IconSend } from 'app/components/icons'
import type { Functions } from '@my/supabase/database.types'
import * as Clipboard from 'expo-clipboard'
import { Copy } from '@tamagui/lucide-icons'

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

  const sendtag = profile?.main_tag_name
  const hostname = isWeb ? window.location.hostname : 'send.app'
  const profileUrl = sendtag
    ? `https://${hostname}/${sendtag}`
    : `https://${hostname}/profile/${profile?.sendid}`

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

          {profileUrl && (
            <YStack ai={'center'} gap={'$3'}>
              <QRCode value={profileUrl} size={240} centerComponent={<IconSend size={'$5'} />} />
              <Paragraph size={'$4'} color={'$color10'} ta={'center'} numberOfLines={1}>
                {profileUrl}
              </Paragraph>
            </YStack>
          )}
          <YStack justifyContent="space-between" marginTop="$4" gap="$4">
            <PrimaryButton
              theme="green"
              borderRadius={'$4'}
              onPress={handleCopyLink}
              focusStyle={{ outlineWidth: 0 }}
            >
              <PrimaryButton.Icon>
                <Copy size={16} color={'$black'} />
              </PrimaryButton.Icon>
              <PrimaryButton.Text>copy link</PrimaryButton.Text>
            </PrimaryButton>
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

      <Dialog.Adapt platform="native">
        <Dialog.Sheet
          modal
          dismissOnSnapToBottom
          dismissOnOverlayPress
          native
          snapPoints={['fit']}
          snapPointsMode="fit"
        >
          <Dialog.Sheet.Frame gap="$3.5" padding="$6">
            <Dialog.Adapt.Contents />
          </Dialog.Sheet.Frame>
          <Dialog.Sheet.Overlay />
        </Dialog.Sheet>
      </Dialog.Adapt>
    </Dialog>
  )
}
