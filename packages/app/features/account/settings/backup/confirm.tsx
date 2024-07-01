import type { Tables } from '@my/supabase/database-generated.types'
import {
  FormWrapper,
  H2,
  Paragraph,
  Spinner,
  SubmitButton,
  YStack,
  useToastController,
} from '@my/ui'
import { baseMainnetClient, sendAccountAbi, tokenPaymasterAddress } from '@my/wagmi'
import { useQuery } from '@tanstack/react-query'
import { SchemaForm } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import { byteaToBytes } from 'app/utils/byteaToBytes'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { defaultUserOp, useUserOpTransferMutation } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import type { UserOperation } from 'permissionless'
import { FormProvider, useForm } from 'react-hook-form'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'
import { encodeFunctionData } from 'viem'
import { useEstimateFeesPerGas } from 'wagmi'
import { z } from 'zod'

type Params = {
  cred_id: string
}

const { useParam } = createParam<Params>()

export const ConfirmPasskeyScreen = () => {
  const [credId] = useParam('cred_id')
  const supabase = useSupabase()
  const { data, error, isLoading } = useQuery({
    queryKey: ['webauthn_credentials', credId],
    enabled: !!credId,
    queryFn: async () => {
      assert(!!credId, 'credId is required')
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('*')
        .eq('id', credId)
        .single()
      if (error) throw error
      return data
    },
  })

  return (
    <YStack w={'100%'} gap={'$6'}>
      {(() => {
        switch (true) {
          case isLoading:
            return <Spinner size="large" color={'$color'} />
          case error !== null:
            return (
              <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
                {error?.message ?? `Something went wrong: ${error}`}
              </Paragraph>
            )
          case !!data:
            return <AddPasskeySigner webauthnCred={data} />
          default:
            return <Paragraph>No credential found for credential ID {credId}</Paragraph>
        }
      })()}
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
        Passkey {webauthnCred?.display_name} has been saved
      </H2>
      <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
        Add your new passkey as a Signer to authorize it to sign transactions on your account.
      </Paragraph>
      <YStack gap={'$2'} jc="center">
        <AddSignerButton webauthnCred={webauthnCred} />
      </YStack>
    </FormWrapper>
  )
}

const AddSignerButton = ({ webauthnCred }: { webauthnCred: Tables<'webauthn_credentials'> }) => {
  const toast = useToastController()
  const {
    data: sendAccount,
    error: sendAccountError,
    isLoading: isLoadingSendAccount,
  } = useSendAccount()
  const keySlot = sendAccount?.send_account_credentials?.find(
    (c) => c.webauthn_credentials?.raw_credential_id === webauthnCred.raw_credential_id
  )?.key_slot
  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials && c.key_slot !== keySlot)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []
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
      const xY = COSEECDHAtoXY(byteaToBytes(webauthnCred.public_key as `\\x${string}`))
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
  const { mutateAsync: sendUserOp } = useUserOpTransferMutation()
  const onSubmit = async () => {
    try {
      throwIf(sendAccountError)
      throwIf(nonceError)
      throwIf(gasFeesError)
      throwIf(userOpError)
      assert(!!userOp, 'User op is required')
      const {
        receipt: { transactionHash },
      } = await sendUserOp({ userOp, webauthnCreds })
      console.log('sent user op', transactionHash)
      toast.show('Success!')
      router.replace('/account/settings/backup')
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

  const isLoading = isLoadingNonce || isLoadingGasFees || isLoadingSendAccount || isLoadingUserOp

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
          <SubmitButton
            mx="auto"
            px="$6"
            onPress={submit}
            {...(isLoading ? { disabled: true } : {})}
          >
            Add Passkey as Signer
          </SubmitButton>
        )}
      >
        {() => (
          <>
            {form.formState.errors?.root?.message ? (
              <Paragraph size={'$6'} fontWeight={'300'} color={'$error'}>
                {form.formState.errors?.root?.message}
              </Paragraph>
            ) : null}
          </>
        )}
      </SchemaForm>
    </FormProvider>
  )
}
