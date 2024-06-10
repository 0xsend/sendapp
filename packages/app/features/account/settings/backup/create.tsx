import { createPasskey } from '@daimo/expo-passkeys'
import type { Tables } from '@my/supabase/database-generated.types'
import { H1, Paragraph, Spinner, SubmitButton, YStack } from '@my/ui'
import {
  baseMainnetClient,
  useReadSendAccountGetActiveSigningKeys,
  useReadSendAccountMaxKeys,
} from '@my/wagmi'
import { base16, base64 } from '@scure/base'
import { useQuery } from '@tanstack/react-query'
import { SchemaForm } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import { base64ToBase16 } from 'app/utils/base64ToBase16'
import { parseCreateResponse } from 'app/utils/passkeys'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useUser } from 'app/utils/useUser'
import * as Device from 'expo-device'
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
    <YStack w={'100%'} gap={'$6'}>
      <CreatePasskeyForm
        onPasskeySaved={(cred) => router.push(`/account/settings/backup/confirm/${cred.id}`)}
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

  const isLoading = isLoadingUser || isLoadingSendAccount || isLoadingKeySlot

  const onSubmit = async ({ accountName }: CreatePasskeySchema): Promise<void> => {
    try {
      throwIf(keySlotError)
      throwIf(sendAccountsError)
      assert(!!userId, 'User id not found')
      assert(!!sendAcct, 'No send account found')
      assert(!!sendAccountId, 'No send account id found')
      assert(keySlot !== undefined, 'No key slot found')

      const passkeyName = `${userId}.${keySlot}`
      const [rawCred, authData] = await createPasskey({
        domain: window.location.hostname,
        challengeB64: base64.encode(Buffer.from('foobar')),
        passkeyName,
        passkeyDisplayTitle: `Send App: ${accountName}`,
      }).then((r) => [r, parseCreateResponse(r)] as const)

      const public_key = `\\x${base16.encode(authData.COSEPublicKey)}`
      const raw_credential_id = `\\x${base64ToBase16(rawCred.credentialIDB64)}`
      const attestation_object = `\\x${base64ToBase16(rawCred.rawAttestationObjectB64)}`

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
      throwIf(error)
      assert(!!webauthnCred, 'Failed to save passkey')
      onPasskeySaved(webauthnCred)
    } catch (e) {
      console.error(e)
      const message =
        e.details?.toString().split('.').at(0) ??
        e.mesage?.split('.').at(0) ??
        e.toString().split('.').at(0)
      form.setError('accountName', {
        type: 'custom',
        message,
      })
    }
  }

  const deviceName = Device.deviceName
    ? Device.deviceName
    : `My ${Device.modelName ?? 'Send Account'}`

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        formProps={{
          $gtLg: {
            als: 'flex-start',
          },
          px: '$0',
        }}
        defaultValues={{
          accountName: deviceName,
        }}
        schema={CreatePasskeySchema}
        onSubmit={onSubmit}
        renderBefore={() => (
          <YStack w={'100%'} gap={'$2'}>
            <H1 size={'$8'} fontWeight={'300'} color={'$color05'}>
              Add Passkey
            </H1>
            <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
              Backup your Send Account by creating a passkey and adding it as a signer to your
              account. Passkeys are authorized devices that can sign transactions for your account.
            </Paragraph>
          </YStack>
        )}
        renderAfter={({ submit }) =>
          isLoading ? (
            <Spinner size="small" color={'$color'} />
          ) : (
            <SubmitButton mx="auto" px="$6" onPress={submit}>
              Create Passkey
            </SubmitButton>
          )
        }
      >
        {(fields) => <>{Object.values(fields)}</>}
      </SchemaForm>
    </FormProvider>
  )
}

/**
 * Finds a free key slot for the given account address.
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
        if (takenSlots[i] === undefined) {
          return i
        }
      }
      throw new Error('No free key slot found')
    },
  })
}
