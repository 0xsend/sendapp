import type { Tables } from '@my/supabase/database-generated.types'
import {
  Fade,
  FormWrapper,
  H1,
  Paragraph,
  Spinner,
  SubmitButton,
  useAppToast,
  YStack,
} from '@my/ui'
import { sendAccountAbi } from '@my/wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { SchemaForm } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import { byteaToBytes } from 'app/utils/byteaToBytes'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import debug from 'debug'
import { FormProvider, useForm } from 'react-hook-form'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'
import { encodeFunctionData } from 'viem'
import { z } from 'zod'
import { Platform } from 'react-native'
import { useUserOpWithPaymaster } from 'app/utils/useUserOpWithPaymaster'
import { useUserOpClaimMutation } from 'app/utils/distributions'

const log = debug('app:settings:backup:confirm')

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
    <YStack w={'100%'} gap={'$3.5'}>
      {Platform.OS === 'web' && <SettingsHeader>Passkeys</SettingsHeader>}
      {(() => {
        switch (true) {
          case isLoading:
            return <Spinner size="large" color={'$color'} />
          case error !== null:
            return (
              <Paragraph maxWidth={600} fontSize={'$5'} color={'$color12'}>
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
    <Fade gap={'$3.5'} $platform-android={{ height: 500 }}>
      <FormWrapper
        elevation={'$0.75'}
        w={'100%'}
        gap={'$3.5'}
        bc={'$color1'}
        borderRadius={'$5'}
        p={'$5'}
        $gtLg={{ p: '$7', gap: '$5', als: 'flex-start', maxWidth: '100%' }}
        f={0}
      >
        <H1 fontSize={'$8'} fontWeight={'600'} color="$color12">
          Add Passkey as Signer
        </H1>
        <Paragraph size={'$5'} color={'$color10'}>
          Your passkey{' '}
          <Paragraph color={'$color12'} fontWeight={600}>
            {webauthnCred?.display_name}
          </Paragraph>{' '}
          has been saved. Add your new passkey as a signer. This will allow you to sign transactions
          on your account with your new passkey.
        </Paragraph>
      </FormWrapper>
      <AddSignerButton webauthnCred={webauthnCred} />
    </Fade>
  )
}

const AddSignerButton = ({ webauthnCred }: { webauthnCred: Tables<'webauthn_credentials'> }) => {
  const toast = useAppToast()
  const queryClient = useQueryClient()
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

  // Build calls for adding the signing key
  const calls = useQuery({
    queryKey: [
      'addSigningKeyCalls',
      sendAccount?.address,
      webauthnCred.public_key,
      keySlot,
      sendAccount,
      webauthnCred,
    ],
    enabled: !!sendAccount && !!webauthnCred && keySlot !== undefined,
    queryFn: async () => {
      assert(!!sendAccount, 'No send account found')
      assert(!!webauthnCred, 'No webauthn credential found')
      assert(keySlot !== undefined, 'No key slot found')

      const xY = COSEECDHAtoXY(byteaToBytes(webauthnCred.public_key as `\\x${string}`))

      return [
        {
          dest: sendAccount.address as `0x${string}`,
          value: 0n,
          data: encodeFunctionData({
            abi: sendAccountAbi,
            functionName: 'addSigningKey',
            args: [keySlot, xY],
          }),
        },
      ]
    },
  })

  const {
    data: result,
    error: userOpError,
    isLoading: isLoadingUserOp,
  } = useUserOpWithPaymaster({
    sender: sendAccount?.address,
    calls: calls.data,
  })

  const userOp = result?.userOp

  const { mutateAsync: sendUserOp } = useUserOpClaimMutation()

  log('sendUserOp', {
    userOp,
    webauthnCred,
    sendAccount,
    keySlot,
    userOpError,
  })
  const onSubmit = async () => {
    try {
      log('sendUserOp', { userOp, webauthnCreds, sendAccount })
      throwIf(sendAccountError)
      throwIf(userOpError)
      assert(!!userOp, 'User op is required')
      const {
        receipt: { transactionHash },
      } = await sendUserOp({ userOp, webauthnCreds })
      console.log('sent user op', transactionHash)
      toast.show('Success!')
      queryClient.invalidateQueries({ queryKey: [useSendAccount.queryKey] })
      router.replace('/account/backup')
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

  const isLoading = isLoadingSendAccount || isLoadingUserOp || calls.isLoading

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        formProps={{
          footerProps: {
            p: 0,
          },
          $gtLg: {
            maxWidth: '100%',
            als: 'flex-start',
          },
          px: '$0',
        }}
        schema={z.object({})}
        onSubmit={onSubmit}
      >
        {() => (
          <YStack gap={'$3.5'}>
            <SubmitButton onPress={() => form.handleSubmit(onSubmit)()} disabled={isLoading}>
              <SubmitButton.Text>Add Passkey as Signer</SubmitButton.Text>
            </SubmitButton>
            {form.formState.errors?.root?.message ? (
              <Paragraph size={'$6'} fontWeight={'300'} color={'$error'}>
                {form.formState.errors?.root?.message}
              </Paragraph>
            ) : null}
          </YStack>
        )}
      </SchemaForm>
    </FormProvider>
  )
}
