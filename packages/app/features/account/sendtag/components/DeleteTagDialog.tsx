import type { Tables } from '@my/supabase/database.types'
import { Button, Dialog, H2, Paragraph, Sheet, Spinner, XStack, YStack, useAppToast } from '@my/ui'
import { IconX } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { api } from 'app/utils/api'
import { Platform } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

interface DeleteTagDialogProps {
  tag: Tables<'tags'>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteTagDialog({ tag, open, onOpenChange, onSuccess }: DeleteTagDialogProps) {
  const toast = useAppToast()
  const { updateProfile } = useUser()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteTag, isPending } = api.tag.delete.useMutation({
    onSuccess: async () => {
      toast.show('Sendtag deleted')
      await updateProfile()
      // Invalidate canDeleteTags query to update UI
      await queryClient.invalidateQueries({ queryKey: [['tag', 'canDeleteTags']] })
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete sendtag')
      console.error('Failed to delete sendtag:', error)
      onOpenChange(false)
    },
  })

  const handleDelete = async () => {
    if (isPending) return
    await deleteTag({ tagId: tag.id })
  }

  // Shared content component to avoid duplication
  const dialogContent = (
    <>
      <H2 fontSize={'$7'} ta={'center'}>
        Delete Sendtag?
      </H2>
      <YStack gap="$3">
        <Paragraph ta="center" size="$5" color="$color12" fontWeight="500">
          Are you sure you want to delete /{tag.name}?
        </Paragraph>
        <Paragraph ta="center" size="$4" color="$color11">
          This tag will become available for others to claim.
        </Paragraph>
      </YStack>
      <XStack gap="$3" w="100%">
        <Button
          flex={1}
          size="$4"
          onPress={() => onOpenChange(false)}
          disabled={isPending}
          pressStyle={{ o: 0.8 }}
        >
          <Button.Text fontSize="$5">Cancel</Button.Text>
        </Button>
        <Button
          flex={1}
          size="$4"
          theme="red"
          onPress={handleDelete}
          disabled={isPending}
          pressStyle={{ o: 0.8 }}
          icon={isPending ? <Spinner size="small" color="$white" /> : undefined}
        >
          <Button.Text fontSize="$5" color="$white">
            {isPending ? 'Deleting...' : 'Delete'}
          </Button.Text>
        </Button>
      </XStack>
      {Platform.OS === 'web' && (
        <Dialog.Close asChild>
          <Button
            position="absolute"
            top="$3"
            right="$3"
            size="$2"
            circular
            icon={<IconX size={16} color="$color12" />}
          />
        </Dialog.Close>
      )}
    </>
  )

  // Web version using Dialog
  if (Platform.OS === 'web') {
    return (
      <Dialog modal open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
            width="100%"
            maxWidth={450}
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
      open={open}
      modal
      onOpenChange={onOpenChange}
      dismissOnSnapToBottom
      dismissOnOverlayPress={!isPending}
      native
      snapPoints={['fit']}
      snapPointsMode="fit"
    >
      <Sheet.Frame key="delete-tag-sheet" gap="$4" padding="$4" pb={'$6'}>
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
