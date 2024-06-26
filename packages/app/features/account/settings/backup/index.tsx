import {
  Button,
  H1,
  H4,
  H5,
  Link,
  Paragraph,
  Separator,
  Spinner,
  SubmitButton,
  Text,
  XStack,
  YStack,
  isWeb,
} from '@my/ui'
import {
  baseMainnetClient,
  sendAccountAbi,
  tokenPaymasterAddress,
  usdcAddress,
  useReadSendAccountGetActiveSigningKeys,
} from '@my/wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { IconDots, IconNote, IconX } from 'app/components/icons'
import { SchemaForm } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import { byteaToBytes } from 'app/utils/byteaToBytes'
import { formatTimeDate } from 'app/utils/formatTimeDate'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { defaultUserOp, useUserOpTransferMutation } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import type { UserOperation } from 'permissionless'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useLink } from 'solito/link'
import { encodeFunctionData } from 'viem'
import { useBalance, useEstimateFeesPerGas } from 'wagmi'
import { z } from 'zod'

export const BackupScreen = () => {
  const { data: sendAcct, error, isLoading } = useSendAccount()
  const hasSendAccount = !!sendAcct
  return (
    <YStack w={'100%'} als={'center'} gap={'$size.3.5'}>
      <YStack w={'100%'} gap={'$size.2'}>
        <H1
          size={'$8'}
          fontWeight={'300'}
          $theme-dark={{ color: '$lightGrayTextField' }}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Add Passkeys as Signers
        </H1>

        <Paragraph
          size={'$5'}
          $theme-dark={{ color: '$lightGrayTextField' }}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Secure your Send Account by adding up to 20 passkeys. Passkeys are trusted devices
          authorized to sign your account&apos;s transactions.
        </Paragraph>
      </YStack>

      {(() => {
        switch (true) {
          case error !== null:
            return (
              <YStack w={'100%'} gap={'$6'}>
                <Separator w={'100%'} $theme-dark={{ borderColor: '$decay' }} />
                <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
                  {error.message}
                </Paragraph>
              </YStack>
            )
          case isLoading:
            return <Spinner size="large" color="$color" />
          case !hasSendAccount:
            return (
              <YStack w={'100%'} gap={'$6'}>
                <Separator w={'100%'} $theme-dark={{ borderColor: '$decay' }} />
                <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
                  You have no Send Account.
                </Paragraph>
                <Link
                  href="https://info.send.it/send/mission-vision-and-values"
                  target="_blank"
                  display="flex"
                  alignItems="center"
                  gap="2"
                  color="$color12"
                >
                  <IconNote size="1.5" />
                  <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
                    Learn more about Send Accounts
                  </Paragraph>
                </Link>
              </YStack>
            )
          default:
            return <WebauthnCreds sendAcct={sendAcct} />
        }
      })()}
    </YStack>
  )
}

const WebauthnCreds = ({
  sendAcct,
}: { sendAcct: NonNullable<ReturnType<typeof useSendAccount>['data']> }) => {
  const addPasskeyLink = useLink({
    href: '/account/settings/backup/create',
  })

  return (
    <YStack w={'100%'} gap={'$size.3'}>
      <XStack w={'100%'} gap={'$2'} jc="space-between" ai="center">
        <YStack>
          <Button theme="green" {...addPasskeyLink}>
            Add Passkey
          </Button>
        </YStack>
      </XStack>

      <Separator w={'100%'} $theme-dark={{ borderColor: '$decay' }} />

      <XStack gap="$5" flexWrap="wrap" ai="flex-start">
        {sendAcct.send_account_credentials.map((cred) => (
          <SendAccountCredentials
            key={`${sendAcct.id}-${cred.key_slot}`}
            address={sendAcct.address}
            cred={cred}
          />
        ))}
      </XStack>
    </YStack>
  )
}

type SendAccountCredential = NonNullable<
  ReturnType<typeof useSendAccount>['data']
>['send_account_credentials'][number]

const SendAccountCredentials = ({
  address,
  cred,
}: {
  address: `0x${string}`
  cred: SendAccountCredential
}) => {
  const [cardStatus, setCardStatus] = useState<'default' | 'settings' | 'remove'>('default')
  const webauthnCred = cred.webauthn_credentials
  assert(!!webauthnCred, 'webauthnCred not found')
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
  const [x, y] = COSEECDHAtoXY(byteaToBytes(webauthnCred.public_key as `\\x${string}`))
  const activeIndex = activeSigningKeys?.[0].findIndex(([_x, _y]) => x === _x && y === _y) ?? -1
  const isActive = activeIndex !== -1
  const onchainSlot = activeSigningKeys?.[1][activeIndex]
  const link = useLink({
    href: `/account/settings/backup/confirm/${webauthnCred?.id}`,
  })
  assert(!!webauthnCred, 'webauthnCred not found')
  return (
    <YStack
      w={'100%'}
      gap={'$size.1.5'}
      p={'$size.1.5'}
      bc={'$color2'}
      borderRadius={'$5'}
      $gtLg={{
        width: isWeb ? 'calc((100% - 24px) / 2)' : '100%',
      }}
      $gtXl={{
        width: isWeb ? 'calc((100% - 48px) / 3)' : '100%',
      }}
    >
      <XStack jc="space-between" ai="center">
        <H4 fontWeight={'700'} color={cardStatus === 'remove' ? '$error' : '$primary'}>
          {cardStatus === 'remove' ? 'Remove Passkey?' : webauthnCred.display_name}
        </H4>
        {cardStatus !== 'remove' && (
          <Button
            chromeless
            px={'0'}
            borderRadius={'$1'}
            height={'$size.1.5'}
            width={'$size.1.5'}
            onPress={() => setCardStatus(cardStatus === 'default' ? 'settings' : 'default')}
          >
            {cardStatus === 'default' ? <IconDots color={'$primary'} /> : <IconX />}
          </Button>
        )}
      </XStack>

      {(() => {
        switch (cardStatus) {
          case 'settings':
            return (
              <Button
                borderColor={'$error'}
                color={'$error'}
                variant="outlined"
                mt={'$size.0.9'}
                hoverStyle={{ borderColor: '$error' }}
                onPress={() => setCardStatus('remove')}
              >
                REMOVE PASSKEY
              </Button>
            )
          case 'remove':
            return (
              <RemovePasskeyConfirmation
                isActiveOnchain={isActive}
                cred={cred}
                onCancel={() => setCardStatus('default')}
              />
            )
          default:
            return (
              <>
                {cred.created_at && (
                  <CardTextBlock label="Created At" text={formatTimeDate(cred.created_at)} />
                )}

                <CardTextBlock label="Key Slot" text={cred.key_slot.toString().padStart(2, '0')} />

                {(() => {
                  switch (true) {
                    case isLoadingActiveSigningKeys:
                      return <Spinner size="small" />
                    case activeSigningKeysError !== null:
                      return (
                        <Paragraph
                          maxWidth={'600'}
                          fontFamily={'$mono'}
                          fontSize={'$5'}
                          color={'$color12'}
                        >
                          {activeSigningKeysError?.message ??
                            `Something went wrong: ${
                              activeSigningKeysError?.message.split('.').at(0) ??
                              'Something went wrong'
                            }`}
                        </Paragraph>
                      )
                    case !isActive:
                      return (
                        <YStack gap={'$size.1.5'} ai="flex-start">
                          <CardTextBlock
                            label="Status"
                            text="Passkey is not confirmed onchain. Finish confirming the passkey onchain."
                            warningText
                          />
                          <Button theme={'green'} color="$primary" variant="outlined" {...link}>
                            CONFIRM
                          </Button>
                        </YStack>
                      )
                    case onchainSlot !== cred.key_slot:
                      return (
                        <Paragraph fontWeight={'300'} color={'$yellowVibrant'} fontFamily={'$mono'}>
                          Onchain Slot: {onchainSlot} does not match Webauthn Slot: {cred.key_slot}.
                          This should never happen.
                        </Paragraph>
                      )
                    default:
                      return <></>
                  }
                })()}
              </>
            )
        }
      })()}
    </YStack>
  )
}

const CardTextBlock = ({
  label,
  text,
  warningText = false,
}: { label: string; text: string; warningText?: boolean }) => {
  return (
    <YStack gap={'$size.0.5'}>
      <H5
        size={'$5'}
        $theme-dark={{ color: '$lightGrayTextField' }}
        $theme-light={{ color: '$darkGrayTextField' }}
        fontWeight={'400'}
      >
        {label}
      </H5>
      <Paragraph
        fontWeight={'300'}
        size={'$5'}
        $theme-dark={{ color: warningText ? '$error' : '$white' }}
        $theme-light={{ color: warningText ? '$error' : '$black' }}
        fontFamily={'$mono'}
      >
        {text}
      </Paragraph>
    </YStack>
  )
}

const RemovePasskeySchema = z.object({
  name: z.string(),
})

type RemovePasskeySchema = z.infer<typeof RemovePasskeySchema>

const RemovePasskeyConfirmation = ({
  cred,
  onCancel,
  isActiveOnchain,
}: {
  cred: SendAccountCredential
  onCancel: () => void
  /**
   * Whether the credential is onchain and an active key slot
   */
  isActiveOnchain: boolean
}) => {
  const supabase = useSupabase()
  const { key_slot: keySlot } = cred
  const webauthnCred = cred.webauthn_credentials
  assert(!!webauthnCred, 'No webauthn credential found') // should be impossible
  const { display_name: displayName } = webauthnCred
  const {
    data: sendAccount,
    error: sendAccountError,
    isLoading: isLoadingSendAccount,
  } = useSendAccount()
  const {
    data: usdcBal,
    error: usdcBalError,
    isLoading: isLoadingUsdcBal,
  } = useBalance({
    address: sendAccount?.address,
    token: usdcAddress[baseMainnetClient.chain.id],
  })
  const form = useForm<RemovePasskeySchema>()
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
      'removeSigningKey',
      sendAccount?.address,
      String(nonce),
      sendAccount,
      keySlot,
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
      assert(keySlot !== undefined, 'No key slot found')
      assert(nonce !== undefined, 'No nonce found')
      assert(maxFeePerGas !== undefined, 'No max fee per gas found')
      assert(maxPriorityFeePerGas !== undefined, 'No max priority fee per gas found')
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
                functionName: 'removeSigningKey',
                args: [keySlot],
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
  const queryClient = useQueryClient()
  const onSubmit = async () => {
    try {
      if (isActiveOnchain) {
        throwIf(sendAccountError)
        throwIf(nonceError)
        throwIf(gasFeesError)
        throwIf(userOpError)
        throwIf(usdcBalError)
        assert((usdcBal?.value ?? 0n) > 0n, 'No USDC balance to pay for gas fees')
        assert(!!userOp, 'User op is required')

        await sendUserOp({ userOp })
      }

      const { error } = await supabase
        .from('webauthn_credentials')
        .delete()
        .eq('id', webauthnCred.id)

      throwIf(error)

      await queryClient.invalidateQueries({ queryKey: [useSendAccount.queryKey] })
      await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
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

  const isLoading =
    isLoadingNonce ||
    isLoadingGasFees ||
    isLoadingSendAccount ||
    isLoadingUserOp ||
    isLoadingUsdcBal
  const inputVal = form.watch('name', '')

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        formProps={{
          $gtLg: {
            als: 'flex-start',
          },
          $gtMd: {
            maxWidth: '100%',
          },
          px: '$0',
        }}
        props={{
          name: {
            boc: 'transparent',
            borderRadius: '$4',
            color: '$color11',
            ff: '$mono',
            autoFocus: true,
          },
        }}
        schema={RemovePasskeySchema}
        onSubmit={onSubmit}
        renderAfter={({ submit }) => (
          <XStack gap="$size.1" jc="space-between" w={'100%'} pt={'$size.0.9'}>
            <Button
              borderColor={'$primary'}
              color={'$primary'}
              variant="outlined"
              flex={1}
              hoverStyle={{ borderColor: '$primary' }}
              onPress={onCancel}
            >
              CANCEL
            </Button>
            <SubmitButton
              testID={'RemovePasskeyButton'}
              theme={'red'}
              color={'$error'}
              variant="outlined"
              flex={1}
              hoverStyle={{ borderColor: '$error' }}
              disabledStyle={{ opacity: 0.5 }}
              onPress={submit}
              {...(isLoading || displayName !== inputVal ? { disabled: true } : {})}
            >
              REMOVE
            </SubmitButton>
          </XStack>
        )}
      >
        {({ name: nameCheck }) => (
          <YStack gap={'$size.3.5'}>
            <Text fontWeight={'400'} fontSize={'$5'} color="$color12" fontFamily={'$mono'}>
              Removing &quot;{displayName}&quot; as a signer on your Send account.{' '}
              <Text
                fontWeight={'400'}
                fontSize={'$5'}
                $theme-dark={{ color: '$warning' }}
                $theme-light={{ color: '$yellow300' }}
                fontFamily={'$mono'}
              >
                This cannot be undone.
              </Text>
            </Text>

            <YStack gap={'$size.1.5'}>
              <Text
                fontWeight={'400'}
                fontSize={'$5'}
                $theme-dark={{ color: '$white' }}
                $theme-light={{ color: '$black' }}
                fontFamily={'$mono'}
              >
                Please enter &quot;{displayName}&quot; below
              </Text>

              {nameCheck}
              {form.formState.errors?.root?.message ? (
                <Paragraph
                  testID="RemovePasskeyError"
                  size={'$6'}
                  fontWeight={'300'}
                  $theme-dark={{ color: '$warning' }}
                  $theme-light={{ color: '$yellow300' }}
                >
                  {form.formState.errors?.root?.message}
                </Paragraph>
              ) : null}
            </YStack>
          </YStack>
        )}
      </SchemaForm>
    </FormProvider>
  )
}
