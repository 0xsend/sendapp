import type { Tables } from '@my/supabase/database.types'
import { Button, Dialog, H2, Paragraph, Sheet, Spinner, XStack, YStack, useAppToast } from '@my/ui'
import { IconX } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { api } from 'app/utils/api'
import { Platform } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useSendAccount } from 'app/utils/send-accounts'
import { signChallenge } from 'app/utils/signChallenge'
import { webauthnCredToAllowedCredentials } from 'app/utils/signUserOp'
import { bytesToHex, hexToBytes } from 'viem'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { useMemo, useState } from 'react'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'

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
  const { data: sendAccount } = useSendAccount()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Challenge API mutations
  const { mutateAsync: getChallenge } = api.challenge.getChallenge.useMutation({ retry: false })
  const { mutateAsync: validateSignature } = api.challenge.validateSignature.useMutation({
    retry: false,
  })

  const { mutateAsync: deleteTag, isPending: isDeleting } = api.tag.delete.useMutation({
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

  // Get webauthn credentials for passkey signing
  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        ?.map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )

  const allowedCredentials = useMemo(
    () => webauthnCredToAllowedCredentials(webauthnCreds),
    [webauthnCreds]
  )

  const handleDelete = async () => {
    if (isAuthenticating || isDeleting) return

    setIsAuthenticating(true)

    try {
      // Step 1: Get challenge from backend
      const challengeData = await getChallenge()

      // Step 2: Sign challenge with passkey
      const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
        challengeData.challenge as `0x${string}`,
        allowedCredentials
      )

      // Step 3: Prepare signature for validation
      const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
      const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
      newEncodedWebAuthnSigBytes[0] = keySlot
      newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)

      // Step 4: Validate signature with backend
      await validateSignature({
        recoveryType: RecoveryOptions.WEBAUTHN,
        signature: bytesToHex(newEncodedWebAuthnSigBytes),
        challengeId: challengeData.id,
        identifier: `${accountName}.${keySlot}`,
      })

      // Step 5: If signature is valid, proceed with deletion
      await deleteTag({ tagId: tag.id })
    } catch (error) {
      console.error('Failed to authenticate or delete sendtag:', error)
      toast.error(formatErrorMessage(error))
      onOpenChange(false)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const isPending = isAuthenticating || isDeleting

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
          This Sendtag will become available for others to claim.
        </Paragraph>
      </YStack>
      <XStack gap="$3" w="100%">
        <Button
          flex={1}
          width={'100%'}
          size="$4"
          onPress={() => onOpenChange(false)}
          disabled={isPending}
          pressStyle={{ o: 0.8 }}
        >
          <Button.Text fontSize="$5">Cancel</Button.Text>
        </Button>
        <Button
          flex={1}
          width={'100%'}
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
