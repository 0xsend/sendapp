import { useMemo, useState } from 'react'
import { Button, Spinner, SubmitButton, useAppToast, XStack, YStack } from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useSendAccount } from 'app/utils/send-accounts'
import { signChallenge } from 'app/utils/signChallenge'
import { SchemaForm } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { type CantonWalletFormData, CantonWalletSchema } from 'app/utils/zod/cantonWallet'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from 'app/utils/api'
import { bytesToHex, hexToBytes } from 'viem'
import { webauthnCredToAllowedCredentials } from 'app/utils/signUserOp'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { Paragraph, useThemeName } from 'tamagui'
import { Platform } from 'react-native'
import { IconX } from 'app/components/icons'

interface CantonWalletFormProps {
  isVisible: boolean
  onSuccess: () => void
}

export function CantonWalletForm({ isVisible, onSuccess }: CantonWalletFormProps) {
  const { profile } = useUser()
  const { data: sendAccount } = useSendAccount()
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const toast = useAppToast()
  const theme = useThemeName()
  const borderColor = theme?.startsWith('dark') ? '$primary' : '$color12'
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<CantonWalletFormData>({
    defaultValues: { address: '' },
  })

  const formAddress = form.watch('address')

  // Get the webauthn credentials for signing (same pattern as other operations)
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

  const { mutateAsync: getChallenge } = api.challenge.getChallenge.useMutation({ retry: false })
  const { mutateAsync: validateSignature } = api.challenge.validateSignature.useMutation({
    retry: false,
  })

  const verifyMutation = useMutation({
    mutationFn: async (data: CantonWalletFormData) => {
      // Get challenge from API (proper authentication flow)
      const challengeData = await getChallenge()

      // Sign with passkey using user's existing credentials
      const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
        challengeData.challenge as `0x${string}`,
        allowedCredentials
      )

      // Prepare signature for validation
      const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
      const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
      newEncodedWebAuthnSigBytes[0] = keySlot
      newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)

      // Validate signature with API
      await validateSignature({
        recoveryType: RecoveryOptions.WEBAUTHN,
        signature: bytesToHex(newEncodedWebAuthnSigBytes),
        challengeId: challengeData.id,
        identifier: `${accountName}.${keySlot}`,
      })

      // Ensure we have a valid user ID
      if (!profile?.id) {
        throw new Error('User not authenticated')
      }

      // Save to Supabase directly after successful signature validation
      const { data: result, error } = await supabase
        .from('canton_party_verifications')
        .insert({
          user_id: profile.id,
          canton_wallet_address: data.address,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: () => {
      toast.show('Canton wallet address verified successfully')
      form.reset()
      onSuccess()
      // Invalidate user profile query to refetch with new verification
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (error) => {
      console.error('Verification failed:', error)
      toast.error('Verification failed')
    },
  })

  const handleVerify = async () => {
    const values = form.getValues()
    const { data, error } = CantonWalletSchema.safeParse(values)

    if (error || !data) {
      setErrorMessage(error?.errors?.[0]?.message ?? 'Invalid input')
      return
    }

    await verifyMutation.mutateAsync(data)
  }

  const handleClearClick = () => {
    form.setValue('address', '')
    setErrorMessage(null)
  }

  if (!isVisible) {
    return null
  }

  return (
    <YStack w="100%" p={'$3'} pl={0} pb={0}>
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          onSubmit={handleVerify}
          schema={CantonWalletSchema}
          defaultValues={{ address: '' }}
          props={{
            address: {
              placeholder: 'Enter Canton Wallet Address',
              pr: '$8',
              fontWeight: 'normal',
              br: '$4',
              bw: 0,
              height: 48,
              hoverStyle: {
                bw: 0,
              },
              '$theme-dark': {
                placeholderTextColor: '$silverChalice',
                backgroundColor: '#2b3639',
              },
              '$theme-light': {
                placeholderTextColor: '$darkGrayTextField',
                backgroundColor: '#f2f2f2',
              },
              focusStyle: {
                boc: borderColor,
                bw: 1,
                outlineWidth: 0,
              },
              fontSize: 17,
              fieldsetProps: {
                width: '100%',
              },
              iconAfter: formAddress && (
                <Button
                  chromeless
                  unstyled
                  cursor={'pointer'}
                  mr={Platform.OS === 'web' ? 0 : '$3'}
                  icon={<IconX color={'$primary'} $theme-light={{ color: '$black' }} size="$1" />}
                  onPress={handleClearClick}
                />
              ),
            },
          }}
          formProps={{
            width: '100%',
            f: 1,
            $gtSm: {
              maxWidth: '100%',
            },
          }}
        >
          {({ address }) => (
            <>
              <XStack gap="$3" w="100%" ai={'flex-start'}>
                <XStack w={'70%'} $gtLg={{ w: '85%' }}>
                  {address}
                </XStack>
                <SubmitButton
                  onPress={handleVerify}
                  width={'30%'}
                  height={44}
                  $gtLg={{ w: '15%' }}
                  disabled={verifyMutation.isPending}
                  icon={verifyMutation.isPending ? <Spinner size="small" /> : undefined}
                >
                  <SubmitButton.Text tt={undefined}>Verify</SubmitButton.Text>
                </SubmitButton>
              </XStack>
              <Paragraph color={'$error'}>{errorMessage}</Paragraph>
            </>
          )}
        </SchemaForm>
      </FormProvider>
    </YStack>
  )
}
