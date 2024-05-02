import { createPasskey } from '@daimo/expo-passkeys'
import type { Tables } from '@my/supabase/database-generated.types'
import {
  FormWrapper,
  H1,
  H2,
  Paragraph,
  Spinner,
  SubmitButton as SubmitButtonOG,
  YStack,
  useToastController,
  type ButtonProps,
} from '@my/ui'
import {
  baseMainnetClient,
  sendAccountAbi,
  tokenPaymasterAddress,
  useReadSendAccountGetActiveSigningKeys,
  useReadSendAccountMaxKeys,
} from '@my/wagmi'
import { base16, base64 } from '@scure/base'
import { useQuery } from '@tanstack/react-query'
import { SchemaForm } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import { base64ToBase16 } from 'app/utils/base64ToBase16'
import { COSEECDHAtoXY, parseCreateResponse } from 'app/utils/passkeys'
import { pgBase16ToBytes } from 'app/utils/pgBase16ToBytes'
import { useSendAccounts } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useUser } from 'app/utils/useUser'
import {
  defaultUserOp,
  useUserOpGasEstimate,
  useUserOpTransferMutation,
} from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import * as Device from 'expo-device'
import type { UserOperation } from 'permissionless'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { encodeFunctionData } from 'viem'
import { useEstimateFeesPerGas } from 'wagmi'
import { z } from 'zod'

const AddPasskeySchema = z.object({
  accountName: z.string().min(1).trim().describe('Passkey name'),
})

type AddPasskeySchema = z.infer<typeof AddPasskeySchema>

export const AddPasskeyScreen = () => {
  const [webauthnCred, setWebauthnCred] = useState<Tables<'webauthn_credentials'> | null>(null)

  const passkeySaved = !!webauthnCred

  return (
    <YStack w={'100%'} gap={'$6'}>
      {!passkeySaved ? (
        <CreatePasskeyForm onPasskeySaved={setWebauthnCred} />
      ) : (
        <AddPasskeySigner webauthnCred={webauthnCred} />
      )}
    </YStack>
  )
}

const AddPasskeySigner = ({ webauthnCred }: { webauthnCred: Tables<'webauthn_credentials'> }) => {
  return (
    <FormWrapper
      $gtLg={{
        als: 'flex-start',
      }}
      gap={'$2'}
    >
      <H2 size={'$8'} fontWeight={'300'} color={'$color05'}>
        Add Passkey as Signer
      </H2>
      <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
        Your passkey {webauthnCred?.display_name} has been saved. Add your new passkey as a signer.
        This will allow you to sign transactions on your account with your new passkey.
      </Paragraph>
      <YStack gap={'$2'} jc="center">
        <AddSignerButton webauthnCred={webauthnCred} />
      </YStack>
    </FormWrapper>
  )
}

/**
 * Creates a new passkey and saves it to the database.
 */
const CreatePasskeyForm = ({
  onPasskeySaved,
}: {
  onPasskeySaved: (webauthnCred: Tables<'webauthn_credentials'> | null) => void
}) => {
  const supabase = useSupabase()
  const {
    data: sendAccts,
    isLoading: isLoadingSendAccounts,
    error: sendAccountsError,
  } = useSendAccounts()
  const sendAccount = sendAccts?.[0]
  const sendAccountId = sendAccts?.[0]?.id
  const { user, isLoading: isLoadingUser } = useUser()
  const userId = user?.id
  const form = useForm<AddPasskeySchema>()
  const {
    data: keySlot,
    error: keySlotError,
    isLoading: isLoadingKeySlot,
  } = useFreeKeySlot({
    address: sendAccount?.address,
  })

  const isLoading = isLoadingUser || isLoadingSendAccounts || isLoadingKeySlot

  const onSubmit = async ({ accountName }: AddPasskeySchema): Promise<void> => {
    try {
      throwIf(keySlotError)
      throwIf(sendAccountsError)
      assert(!!userId, 'User id not found')
      assert(!!sendAccts && sendAccts.length > 0, 'No send accounts found')
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
      onPasskeySaved(webauthnCred)
    } catch (e) {
      form.setError('accountName', {
        type: 'custom',
        message: e.mesage ?? `Something went wrong: ${e}`,
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
        schema={AddPasskeySchema}
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
            <SubmitButton onPress={submit}>Create Passkey</SubmitButton>
          )
        }
      >
        {(fields) => <>{Object.values(fields)}</>}
      </SchemaForm>
    </FormProvider>
  )
}

export const AddSignerButton = ({
  webauthnCred,
}: { webauthnCred: Tables<'webauthn_credentials'> }) => {
  const toast = useToastController()
  const {
    data: sendAccounts,
    error: sendAccountError,
    isLoading: isLoadingSendAccounts,
  } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]
  const keySlot = sendAccount?.send_account_credentials?.find(
    (c) => c.webauthn_credentials?.raw_credential_id === webauthnCred.raw_credential_id
  )?.key_slot
  const router = useRouter()
  const form = useForm()
  const {
    data: nonce,
    error: nonceError,
    isLoading: isLoadingNonce,
  } = useAccountNonce({ sender: sendAccount?.address })
  const {
    data: feesPerGas,
    error: gasFeesError,
    isLoading: isLoadingGasFees,
  } = useEstimateFeesPerGas({
    chainId: baseMainnetClient.chain.id,
  })
  const { maxFeePerGas, maxPriorityFeePerGas } = feesPerGas ?? {}
  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
  } = useQuery({
    queryKey: [
      'addSigningKey',
      sendAccount?.address,
      String(nonce),
      sendAccount,
      webauthnCred,
      keySlot,
      webauthnCred.public_key,
      String(maxFeePerGas),
      String(maxPriorityFeePerGas),
    ],
    enabled:
      !!sendAccount &&
      !!webauthnCred &&
      nonce !== undefined &&
      keySlot !== undefined &&
      maxFeePerGas !== undefined &&
      maxPriorityFeePerGas !== undefined,
    queryFn: async () => {
      assert(!!sendAccount, 'No send account found')
      assert(!!webauthnCred, 'No webauthn credential found')
      assert(keySlot !== undefined, 'No key slot found')
      assert(nonce !== undefined, 'No nonce found')
      assert(maxFeePerGas !== undefined, 'No max fee per gas found')
      assert(maxPriorityFeePerGas !== undefined, 'No max priority fee per gas found')
      const xY = COSEECDHAtoXY(pgBase16ToBytes(webauthnCred.public_key as `\\x${string}`))
      const callData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [
          [
            {
              dest: sendAccount?.address,
              value: 0n,
              data: encodeFunctionData({
                abi: sendAccountAbi,
                functionName: 'addSigningKey',
                args: [keySlot, xY],
              }),
            },
          ],
        ],
      })

      const chainId = baseMainnetClient.chain.id
      const paymaster = tokenPaymasterAddress[chainId]
      const userOp: UserOperation<'v0.7'> = {
        ...defaultUserOp,
        maxFeePerGas,
        maxPriorityFeePerGas,
        sender: sendAccount?.address,
        nonce,
        callData,
        paymaster,
        paymasterData: '0x',
        signature: '0x',
      }
      return userOp
    },
  })
  const { error: gasEstimateError } = useUserOpGasEstimate({ userOp })
  const { mutateAsync: sendUserOp } = useUserOpTransferMutation()
  const onSubmit = async () => {
    try {
      throwIf(sendAccountError)
      throwIf(nonceError)
      throwIf(gasEstimateError)
      throwIf(gasFeesError)
      throwIf(userOpError)
      assert(!!userOp, 'User op is required')
      const {
        receipt: { transactionHash },
      } = await sendUserOp({ userOp })
      toast.show(`Sent user op ${transactionHash}!`)
      router.replace('/account/settings/backup')
    } catch (e) {
      form.setError('root', {
        type: 'custom',
        message: e.mesage ?? `Something went wrong: ${e}`,
      })
    }
  }

  const isLoading = isLoadingNonce || isLoadingGasFees || isLoadingSendAccounts || isLoadingUserOp

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
        schema={z.object({})}
        onSubmit={onSubmit}
        renderAfter={({ submit }) => (
          <SubmitButton onPress={submit} {...(isLoading ? { disabled: true } : {})}>
            Add Passkey as Signer
          </SubmitButton>
        )}
      >
        {() => (
          <>
            {form.formState.errors?.root?.message ? (
              <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
                {form.formState.errors?.root?.message}
              </Paragraph>
            ) : null}
          </>
        )}
      </SchemaForm>
    </FormProvider>
  )
}

const SubmitButton = (props: ButtonProps) => {
  return <SubmitButtonOG mx="auto" px="$6" {...props} />
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
