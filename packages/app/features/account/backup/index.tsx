import type { Tables } from '@my/supabase/database.types'
import {
  Button,
  Link,
  Paragraph,
  Separator,
  Spinner,
  SubmitButton,
  Text,
  useToastController,
  XStack,
  YStack,
  FadeCard,
} from '@my/ui'
import {
  baseMainnetClient,
  sendAccountAbi,
  tokenPaymasterAddress,
  usdcAddress,
  useReadSendAccountGetActiveSigningKeys,
} from '@my/wagmi'
import type { PostgrestError } from '@supabase/postgrest-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { useCallback, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useLink } from 'solito/link'
import { encodeFunctionData } from 'viem'
import { useBalance, useEstimateFeesPerGas } from 'wagmi'
import { z } from 'zod'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { useThemeSetting } from '@tamagui/next-theme'

export const BackupScreen = () => {
  const { data: sendAcct, error, isLoading } = useSendAccount()
  const supabase = useSupabase()
  const {
    data: webAuthnCreds,
    error: webAuthnCredsError,
    isLoading: isLoadingWebAuthnCreds,
  } = useQuery({
    queryKey: ['webauthn_credentials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('*, send_account_credentials(*)')

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
  })
  const hasSendAccount = !!sendAcct

  return (
    <YStack w={'100%'} als={'center'} gap={'$3.5'}>
      {(() => {
        switch (true) {
          case error !== null || webAuthnCredsError !== null:
            return (
              <YStack w={'100%'}>
                <Paragraph size={'$6'} fontWeight={'300'} color={'$error'}>
                  {error?.message}
                  {webAuthnCredsError?.message}
                </Paragraph>
              </YStack>
            )
          case isLoading || isLoadingWebAuthnCreds:
            return <Spinner size="large" color="$color12" />
          case !webAuthnCreds:
            return (
              <YStack w={'100%'} gap={'$6'}>
                <Paragraph size={'$6'} fontWeight={'300'} color={'$error'}>
                  You have no WebAuthn credentials. This should never happen. Please reach out to
                  <Link href="/account/settings/support" target="_blank">
                    {' '}
                    support
                  </Link>{' '}
                  if you need help.
                </Paragraph>
                <Link
                  href="https://help.send.app/what-are-passkeys/"
                  target="_blank"
                  display="flex"
                  alignItems="center"
                  gap="$2"
                  color="$color12"
                >
                  <IconNote size="$1.5" />
                  <Paragraph size={'$6'} fontWeight={'300'}>
                    Learn more about WebAuthn credentials
                  </Paragraph>
                </Link>
              </YStack>
            )
          case !hasSendAccount:
            return (
              <YStack w={'100%'} gap={'$6'}>
                <Paragraph size={'$6'} fontWeight={'300'}>
                  You have no Send Account.
                </Paragraph>
                <Link
                  href="https://help.send.app/what-are-passkeys/"
                  target="_blank"
                  display="flex"
                  alignItems="center"
                  gap="$2"
                  color="$color12"
                >
                  <IconNote size="$1.5" />
                  <Paragraph size={'$6'} fontWeight={'300'}>
                    Learn more about Send Accounts
                  </Paragraph>
                </Link>
              </YStack>
            )
          default:
            return <WebauthnCreds sendAcct={sendAcct} webAuthnCreds={webAuthnCreds} />
        }
      })()}
    </YStack>
  )
}

const WebauthnCreds = ({
  sendAcct,
  webAuthnCreds,
}: {
  sendAcct: Tables<'send_accounts'>
  webAuthnCreds: (Tables<'webauthn_credentials'> & {
    send_account_credentials: Tables<'send_account_credentials'>[] | null
  })[]
}) => {
  const addPasskeyLink = useLink({
    href: '/account/backup/create',
  })

  return (
    <YStack w={'100%'} gap={'$5'}>
      <YStack gap={'$3.5'}>
        <SettingsHeader>Passkeys</SettingsHeader>
        {webAuthnCreds.map((cred) => (
          <WebAuthnCred key={`${sendAcct.id}-${cred.id}`} sendAcct={sendAcct} cred={cred} />
        ))}
      </YStack>
      <Button theme="green" borderRadius={'$4'} p={'$4'} {...addPasskeyLink}>
        <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
          Add a Passkey
        </Button.Text>
      </Button>
    </YStack>
  )
}

const WebAuthnCred = ({
  sendAcct,
  cred,
}: {
  sendAcct: Tables<'send_accounts'>
  cred: Tables<'webauthn_credentials'> & {
    send_account_credentials: Tables<'send_account_credentials'>[] | null
  }
}) => {
  const address = sendAcct.address
  const [cardStatus, setCardStatus] = useState<'default' | 'settings' | 'remove'>('default')
  const keySlot = cred.send_account_credentials?.[0]?.key_slot
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
  const [x, y] = COSEECDHAtoXY(byteaToBytes(cred.public_key as `\\x${string}`))
  const activeIndex = activeSigningKeys?.[0].findIndex(([_x, _y]) => x === _x && y === _y) ?? -1
  const isActive = isLoadingActiveSigningKeys || activeIndex !== -1 // default to active if loading (strongmind check)
  const onchainSlot = activeSigningKeys?.[1][activeIndex]
  const link = useLink({
    href: `/account/backup/confirm/${cred?.id}`,
  })

  return (
    <FadeCard>
      <XStack jc="space-between" ai="center">
        <Paragraph size={'$5'} color={cardStatus === 'remove' ? '$error' : '$color12'}>
          {cardStatus === 'remove' ? 'Remove Passkey?' : cred.display_name}
        </Paragraph>
        {cardStatus !== 'remove' && (
          <Button
            chromeless
            px={'$0'}
            borderRadius={'$1'}
            height={'$1.5'}
            width={'$1.5'}
            onPress={() => setCardStatus(cardStatus === 'default' ? 'settings' : 'default')}
          >
            {cardStatus === 'default' ? (
              <IconDots color={'$primary'} $theme-light={{ color: '$color12' }} />
            ) : (
              <IconX />
            )}
          </Button>
        )}
      </XStack>
      <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />

      {(() => {
        switch (cardStatus) {
          case 'settings':
            return (
              <Button
                borderColor={'$error'}
                color={'$color12'}
                variant="outlined"
                mt={'$0.9'}
                borderRadius={'$5'}
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
                <YStack gap={'$3.5'} $gtLg={{ flexDirection: 'row' }}>
                  {cred.created_at && (
                    <CardTextBlock label="Created At" text={formatTimeDate(cred.created_at)} />
                  )}
                  {keySlot ? (
                    <CardTextBlock label="Key Slot" text={keySlot.toString().padStart(2, '0')} />
                  ) : activeIndex !== -1 ? (
                    <CardTextBlock
                      label="Key Slot"
                      text={activeIndex.toString().padStart(2, '0')}
                    />
                  ) : null}
                </YStack>

                {(() => {
                  switch (true) {
                    case isLoadingActiveSigningKeys:
                      return <Spinner size="small" />
                    case activeSigningKeysError !== null:
                      return (
                        <Paragraph maxWidth={600} fontSize={'$5'} color={'$color12'}>
                          {activeSigningKeysError?.message ??
                            `Something went wrong: ${
                              activeSigningKeysError?.message.split('.').at(0) ??
                              'Something went wrong'
                            }`}
                        </Paragraph>
                      )
                    case !isActive:
                      return (
                        <YStack gap={'$1.5'} ai="flex-start">
                          <CardTextBlock
                            label="Status"
                            text="Passkey is not confirmed onchain. Finish confirming the passkey onchain."
                            warningText
                          />
                          <Button
                            theme={'green'}
                            variant="outlined"
                            borderColor={'$primary'}
                            hoverStyle={{ borderColor: '$primary' }}
                            {...link}
                          >
                            <Button.Text
                              color="$primary"
                              $theme-light={{
                                color: '$color12',
                              }}
                            >
                              CONFIRM
                            </Button.Text>
                          </Button>
                        </YStack>
                      )

                    case !!onchainSlot && onchainSlot !== keySlot: // onchain slot is set but not the same as the key slot, ask user to update
                      return (
                        <UpdateKeySlotButton
                          sendAcct={sendAcct}
                          cred={cred}
                          onchainSlot={onchainSlot}
                        />
                      )
                    default:
                      return <></>
                  }
                })()}
              </>
            )
        }
      })()}
    </FadeCard>
  )
}

const CardTextBlock = ({
  label,
  text,
  warningText = false,
}: {
  label: string
  text: string
  warningText?: boolean
}) => {
  return (
    <YStack gap={'$2'} flexGrow={1}>
      <Paragraph
        size={'$5'}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        {label}
      </Paragraph>
      <Paragraph size={'$5'} color={warningText ? '$error' : '$color12'}>
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
  cred: Tables<'webauthn_credentials'> & {
    send_account_credentials: Tables<'send_account_credentials'>[] | null
  }
  onCancel: () => void
  /**
   * Whether the credential is onchain and an active key slot
   */
  isActiveOnchain: boolean
}) => {
  const supabase = useSupabase()
  const keySlot = cred.send_account_credentials?.[0]?.key_slot
  const { display_name: displayName } = cred
  const {
    data: sendAccount,
    error: sendAccountError,
    isLoading: isLoadingSendAccount,
  } = useSendAccount()
  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []
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
      !!cred &&
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
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const isLoading =
    isLoadingNonce ||
    isLoadingGasFees ||
    isLoadingSendAccount ||
    isLoadingUserOp ||
    isLoadingUsdcBal
  const inputVal = form.watch('name', '')

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <XStack gap="$1" jc="space-between" w={'100%'} pt={'$0.9'}>
        <Button
          borderColor={'$primary'}
          variant="outlined"
          flex={1}
          hoverStyle={{ borderColor: isDarkTheme ? '$primary' : '$color12' }}
          $theme-light={{
            borderColor: '$color12',
          }}
          onPress={onCancel}
        >
          <Button.Text
            color="$primary"
            $theme-light={{
              color: '$color12',
            }}
          >
            CANCEL
          </Button.Text>
        </Button>
        <SubmitButton
          testID={'RemovePasskeyButton'}
          theme={'red'}
          variant="outlined"
          flex={1}
          hoverStyle={{ borderColor: '$error' }}
          disabledStyle={{ opacity: 0.5 }}
          onPress={submit}
          {...(isLoading || displayName !== inputVal ? { disabled: true } : {})}
        >
          <Button.Text
            color={'$error'}
            $theme-light={{
              color: '$color12',
            }}
          >
            REMOVE
          </Button.Text>
        </SubmitButton>
      </XStack>
    ),
    [onCancel, isLoading, displayName, inputVal, isDarkTheme]
  )

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

        await sendUserOp({ userOp, webauthnCreds })
      }

      const { error } = await supabase.from('webauthn_credentials').delete().eq('id', cred.id)

      throwIf(error)

      await queryClient.invalidateQueries({ queryKey: [useSendAccount.queryKey] })
      await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
      await queryClient.invalidateQueries({ queryKey: ['webauthn_credentials'] })
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
            bc: '$color0',
            autoFocus: true,
          },
        }}
        schema={RemovePasskeySchema}
        onSubmit={onSubmit}
        renderAfter={renderAfterContent}
      >
        {({ name: nameCheck }) => (
          <YStack gap={'$3.5'}>
            <Text fontWeight={'400'} fontSize={'$5'} color="$color12">
              Removing &quot;{displayName}&quot; as a signer on your Send account.{' '}
              <Text
                fontWeight={'400'}
                fontSize={'$5'}
                $theme-dark={{ color: '$warning' }}
                $theme-light={{ color: '$networkBnb' }}
              >
                This cannot be undone.
              </Text>
            </Text>

            <YStack gap={'$1.5'}>
              <Text
                fontWeight={'400'}
                fontSize={'$5'}
                $theme-dark={{ color: '$white' }}
                $theme-light={{ color: '$black' }}
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
                  $theme-light={{ color: '$networkBnb' }}
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

const UpdateKeySlotButton = ({
  sendAcct,
  cred,
  onchainSlot,
}: {
  sendAcct: Tables<'send_accounts'>
  cred: Tables<'webauthn_credentials'> & {
    send_account_credentials: Tables<'send_account_credentials'>[] | null
  }
  onchainSlot: number
}) => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const sendAcctCred = cred.send_account_credentials?.[0] // should be impossible but just in case
  const toast = useToastController()
  const {
    mutate: updateKeySlot,
    isPending,
    error,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: async (keySlot: number) => {
      let error: PostgrestError | null = null
      if (!sendAcctCred) {
        // no send account credential, create one with the key slot
        const result = await supabase.from('send_account_credentials').insert({
          account_id: sendAcct.id,
          credential_id: cred.id,
          key_slot: keySlot,
        })
        error = result.error
      } else {
        const result = await supabase
          .from('send_account_credentials')
          .update({ key_slot: keySlot })
          .eq('credential_id', cred.id)
        error = result.error
      }
      if (error) {
        if (error.code === '23505') {
          throw new Error(
            `Key slot ${keySlot
              .toString()
              .padStart(2, '0')} already in use, delete the existing key slot and try again.`
          )
        }
        throw new Error(error.message)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['webauthn_credentials'] })
      toast.show('Updated key slot')
    },
  })
  const isDisabled = isSuccess || isPending
  return (
    <>
      <Paragraph fontWeight={'300'} color={'$warning'}>
        Onchain Slot, {onchainSlot}, does not match Webauthn Slot {sendAcctCred?.key_slot ?? 'N/A'}.
        This should never happen. Please update the key slot below.
      </Paragraph>
      <Button onPress={() => updateKeySlot(onchainSlot)} disabled={isDisabled}>
        Update Key Slot
      </Button>
      {isError && <Paragraph color={'$error'}>{error?.message}</Paragraph>}
      {isSuccess && <Paragraph color={'$primary'}>Updated key slot</Paragraph>}
    </>
  )
}
