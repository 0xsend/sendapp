import type { Tables } from '@my/supabase/database-generated.types'
import { Button, FadeCard, H1, Paragraph, Shake, Spinner, SubmitButton, YStack } from '@my/ui'
import {
  baseMainnetClient,
  useReadSendAccountGetActiveSigningKeys,
  useReadSendAccountMaxKeys,
} from '@my/wagmi'
import { base16, base64 } from '@scure/base'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { SchemaForm } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import { base64URLNoPadToBase16 } from 'app/utils/base64ToBase16'
import { createPasskey } from 'app/utils/createPasskey'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useUser } from 'app/utils/useUser'
import * as Device from 'expo-device'
import { useCallback } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { z } from 'zod'

const CreatePasskeySchema = z.object({
  accountName: z.string().min(1).trim().describe('Passkey name'),
})

type CreatePasskeySchema = z.infer<typeof CreatePasskeySchema>

export const CreatePasskeyScreen = () => {
  const router = useRouter()

  return (
    <YStack w={'100%'} gap={'$3.5'}>
      <SettingsHeader>Passkeys</SettingsHeader>
      <CreatePasskeyForm
        onPasskeySaved={(cred) => router.push(`/account/backup/confirm/${cred.id}`)}
      />
    </YStack>
  )
}

/**
 * Creates a new passkey and saves it to the database.
 */
const CreatePasskeyForm = ({
  onPasskeySaved,
}: {
  onPasskeySaved: (webauthnCred: Tables<'webauthn_credentials'>) => void
}) => {
  const supabase = useSupabase()
  const {
    data: sendAcct,
    isLoading: isLoadingSendAccount,
    error: sendAccountsError,
  } = useSendAccount()
  const sendAccountId = sendAcct?.id
  const { user, isLoading: isLoadingUser } = useUser()
  const userId = user?.id
  const form = useForm<CreatePasskeySchema>()
  const {
    data: keySlot,
    error: keySlotError,
    isLoading: isLoadingKeySlot,
  } = useFreeKeySlot({
    address: sendAcct?.address,
  })
  const queryClient = useQueryClient()

  const isLoading = isLoadingUser || isLoadingSendAccount || isLoadingKeySlot

  const onSubmit = async ({ accountName }: CreatePasskeySchema): Promise<void> => {
    try {
      throwIf(keySlotError)
      throwIf(sendAccountsError)
      assert(!!userId, 'User id not found')
      assert(!!sendAcct, 'No send account found')
      assert(!!sendAccountId, 'No send account id found')
      assert(keySlot !== undefined, 'No key slot found')

      const challenge = base64.encode(Buffer.from('foobar'))
      const passkeyName = `${userId}.${keySlot}`
      const [rawCred, authData] = await createPasskey({ user, keySlot, challenge, accountName })

      const public_key = `\\x${base16.encode(authData.COSEPublicKey)}`
      const raw_credential_id = `\\x${base64URLNoPadToBase16(rawCred.rawId)}`
      const attestation_object = `\\x${base64URLNoPadToBase16(rawCred.response.attestationObject)}`

      const { data: webauthnCred, error } = await supabase.rpc(
        'send_accounts_add_webauthn_credential',
        {
          send_account_id: sendAccountId,
          webauthn_credential: {
            name: passkeyName,
            display_name: accountName,
            raw_credential_id,
            public_key,
            sign_count: 0,
            attestation_object,
            key_type: 'ES256',
          },
          key_slot: keySlot,
        }
      )
      if (error) {
        if (error.code === '23505') {
          throw new Error('Key slot already in use, delete the existing key slot and try again.')
        }
        throw error.message
      }
      queryClient.invalidateQueries({ queryKey: [useSendAccount.queryKey] })
      assert(!!webauthnCred, 'Failed to save passkey')
      onPasskeySaved(webauthnCred)
    } catch (e) {
      console.error(e)
      const message =
        e.details?.toString().split('.').at(0) ??
        e.mesage?.split('.').at(0) ??
        e.toString().split('.').at(0)
      form.setError('root', {
        type: 'custom',
        message,
      })
    }
  }

  const deviceName = Device.deviceName
    ? Device.deviceName
    : `My ${Device.modelName ?? 'Send Account'}`

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <>
        {form.formState.errors?.root?.message ? (
          <Shake>
            <Paragraph color="red" testID="AccountSendTagScreen">
              {form.formState.errors?.root?.message}
            </Paragraph>
          </Shake>
        ) : null}
        {isLoading ? (
          <Spinner size="small" color={'$color'} />
        ) : (
          <SubmitButton onPress={submit} theme="green" borderRadius={'$4'} p={'$4'} mt={'$1.5'}>
            <Button.Text
              ff={'$mono'}
              fontWeight={'600'}
              tt="uppercase"
              size={'$5'}
              color={'$black'}
            >
              Add a Passkey
            </Button.Text>
          </SubmitButton>
        )}
      </>
    ),
    [form, isLoading]
  )

  return (
    <FadeCard>
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          formProps={{
            $gtLg: {
              maxWidth: '100%',
              als: 'flex-start',
            },
            px: '$0',
          }}
          defaultValues={{
            accountName: deviceName,
          }}
          schema={CreatePasskeySchema}
          onSubmit={onSubmit}
          props={{
            accountName: {
              bc: '$color0',
              labelProps: {
                color: '$color10',
              },
            },
          }}
          renderBefore={() => (
            <>
              <H1 size={'$8'} fontWeight={'600'} color="$color12">
                Secure Your Account with Passkeys
              </H1>
              <Paragraph size={'$5'} color={'$color10'}>
                Secure your Send Account by adding up to 20 passkeys. Passkeys are trusted devices
                authorized to sign your account&apos;s transactions.
              </Paragraph>
            </>
          )}
          renderAfter={renderAfterContent}
        >
          {(fields) => <>{Object.values(fields)}</>}
        </SchemaForm>
      </FormProvider>
    </FadeCard>
  )
}

/**
 * Finds a free key slot for the given account address.
 *
 * The active keys is an array with the X & Y coordinates of the key and their slot.
 *
 * ```ts
 * const activeSigningKeys: readonly [readonly (readonly [`0x${string}`, `0x${string}`])[], readonly number[]] = [
 *   // X & Y coordinates of the key
 *   [
 *     [ "0x4889909311d8d5e31c34db5f5d44a23f4623f6e3539a858422f8384979691a24", "0xf95b830329d26f7998aa4c8181edf291c030dcb519b2f23da6839185c8f7b5b4" ]
 *   ],
 *   // Array of slot numbers corresponding to the X & Y coordinates
 *   [ 1 ]
 *  ]
 *  ```
 *
 * This hook returns the first free slot.
 */
function useFreeKeySlot({ address }: { address: `0x${string}` | undefined }) {
  const {
    data: activeSigningKeys,
    isLoading: isLoadingActiveSigningKeys,
    error: activeSigningKeysError,
  } = useReadSendAccountGetActiveSigningKeys({
    chainId: baseMainnetClient.chain.id,
    address,
    query: {
      enabled: !!address,
    },
  })
  const {
    data: maxSigningKeys,
    isLoading: isLoadingMaxSigningKeys,
    error: maxSigningKeysError,
  } = useReadSendAccountMaxKeys({
    chainId: baseMainnetClient.chain.id,
    address,
    query: {
      enabled: !!address,
    },
  })
  return useQuery({
    queryKey: [
      'keySlot',
      address,
      maxSigningKeys,
      activeSigningKeys,
      activeSigningKeysError,
      maxSigningKeysError,
    ],
    enabled: !!address && !isLoadingActiveSigningKeys && !isLoadingMaxSigningKeys,
    queryFn: async () => {
      assert(!!maxSigningKeys, 'No max signing keys found')
      assert(!!activeSigningKeys, 'No active signing keys found')
      throwIf(activeSigningKeysError)
      throwIf(maxSigningKeysError)
      const takenSlots = activeSigningKeys[1].map((s) => s).sort()
      for (let i = 0; i < maxSigningKeys; i++) {
        if (!takenSlots.includes(i)) {
          return i
        }
      }
      throw new Error('No free key slot found')
    },
  })
}
