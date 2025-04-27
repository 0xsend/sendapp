import {
  Button,
  Paragraph,
  Sheet,
  Spinner,
  Stack,
  type TamaguiElement,
  Theme,
  useDebounce,
  XStack,
  YStack,
} from '@my/ui'
import { allCoins, allCoinsDict } from 'app/data/coins'
import { useProfileScreenParams } from 'app/routers/params'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'

import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { formatUnits, isAddress } from 'viem'

import type { z } from 'zod'

import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useCoin, useCoins } from 'app/provider/coins'
import { IconArrowUp, IconPlus, IconX } from 'app/components/icons'
import { useThemeSetting } from 'app/provider/theme'
import { TransferSchema } from 'app/utils/zod'
import { assert } from 'app/utils/assert'
import { throwIf } from 'app/utils/throwIf'
import { api } from 'app/utils/api'
import { useAccountNonce } from 'app/utils/userop'
import { useGenerateTransferUserOp } from 'app/utils/useUserOpTransferMutation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { baseMainnet, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useEstimateFeesPerGas } from 'wagmi'
import debug from 'debug'
import { signUserOp } from 'app/utils/signUserOp'
import { useUser } from 'app/utils/useUser'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { toNiceError } from 'app/utils/toNiceError'

const log = debug('app:features:profile:screen')

export function SendNoteForm({
  otherUserId,
}: {
  otherUserId?: number
}) {
  const queryClient = useQueryClient()
  const [profileParams, setProfileParams] = useProfileScreenParams()
  const { amount, sendToken, note } = profileParams

  const { data: otherUserProfile, isLoading: isLoadingOtherUserProfile } = useProfileLookup(
    'sendid',
    otherUserId?.toString() || ''
  )
  const { profile: currentUserProfile } = useUser()
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()

  const form = useForm<z.infer<typeof TransferSchema>>()
  const [error, setError] = useState<Error | null>(null)

  const { coin } = useCoinFromSendTokenParam()

  const noteFieldRef = useRef<TamaguiElement>(null)
  const { resolvedTheme } = useThemeSetting()

  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false)

  const onFormChange = useDebounce(
    useCallback(
      (values) => {
        const { amount, token: _token, note } = values
        const sendToken = _token as allCoins[number]['token']
        const sanitizedAmount = sanitizeAmount(
          amount,
          allCoinsDict[sendToken]?.decimals
        )?.toString()

        const noteValidation = formFields.note.safeParse(note)
        if (noteValidation.error) {
          setError(noteValidation.error)
        } else {
          form.clearErrors('note')
        }
        setProfileParams(
          {
            ...profileParams,
            amount: sanitizedAmount,
            sendToken,
            note: note.trim(),
          },
          { webBehavior: 'replace' }
        )
      },
      [setProfileParams, profileParams, form]
    ),
    300,
    { leading: false },
    []
  )

  useEffect(() => {
    const subscription = form.watch(onFormChange)

    return () => {
      subscription.unsubscribe()
      onFormChange.cancel()
    }
  }, [form.watch, onFormChange])

  const formAmount = form.watch('amount')

  const {
    mutateAsync: transfer,
    isPending: isTransferPending,
    isSuccess: isTransferInitialized,
  } = api.temporal.transfer.useMutation()

  const isUSDCSelected = coin?.label === 'USDC'
  const { coin: usdc } = useCoin('USDC')

  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

  const {
    data: nonce,
    error: nonceError,
    isLoading: nonceIsLoading,
  } = useAccountNonce({
    sender: sendAccount?.address,
  })

  const { data: userOp, isPending: isGeneratingUserOp } = useGenerateTransferUserOp({
    sender: sendAccount?.address,
    // @ts-expect-error some work to` do here
    to: otherUserProfile?.address,
    token: sendToken === 'eth' ? undefined : sendToken,
    amount: BigInt(amount ?? '0'),
    nonce,
  })

  const { mutateAsync: validateUserOp, isPending: isValidatePending } = useValidateTransferUserOp()

  const {
    data: usdcFees,
    isLoading: isFeesLoading,
    error: usdcFeesError,
  } = useUSDCFees({
    userOp,
  })

  const {
    data: feesPerGas,
    isLoading: isGasLoading,
    error: feesPerGasError,
  } = useEstimateFeesPerGas({
    chainId: baseMainnet.id,
  })

  const hasEnoughBalance = !!coin?.balance && coin.balance >= BigInt(amount ?? '0')
  const gas = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : BigInt(Number.MAX_SAFE_INTEGER)
  const hasEnoughGas =
    (usdc?.balance ?? BigInt(0)) > (isUSDCSelected ? BigInt(amount ?? '0') + gas : gas)

  const isLoading =
    nonceIsLoading ||
    isSendAccountLoading ||
    isGeneratingUserOp ||
    isGasLoading ||
    isFeesLoading ||
    isLoadingOtherUserProfile

  const isSubmitting = isValidatePending || isTransferPending || isTransferInitialized

  const canSubmit =
    (!isLoading || !isSubmitting) && hasEnoughBalance && hasEnoughGas && feesPerGas && !!error

  async function onSubmit() {
    if (!amount || !sendToken) {
      setIsSheetOpen(true)
      return
    }
    try {
      assert(!!userOp, 'User op is required')
      assert(!!coin?.balance, 'Balance is not available')
      assert(nonceError === null, `Failed to get nonce: ${nonceError}`)
      assert(nonce !== undefined, 'Nonce is not available')
      throwIf(feesPerGasError)
      assert(!!feesPerGas, 'Fees per gas is not available')
      assert(
        !note || !formFields.note.safeParse(note).error,
        'Note failed to match validation constraints'
      )

      assert(coin?.balance >= BigInt(amount ?? '0'), 'Insufficient balance')
      const sender = sendAccount?.address as `0x${string}`
      assert(isAddress(sender), 'No sender address')
      const _userOp = {
        ...userOp,
        maxFeePerGas: feesPerGas.maxFeePerGas,
        maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
      }

      log('gasEstimate', usdcFees)
      log('feesPerGas', feesPerGas)
      log('userOp', _userOp)
      const chainId = baseMainnetClient.chain.id
      const entryPoint = entryPointAddress[chainId]

      const signature = await signUserOp({
        userOp,
        chainId,
        webauthnCreds,
        entryPoint,
      })
      userOp.signature = signature

      const validatedUserOp = await validateUserOp(userOp)
      assert(!!validatedUserOp, 'Operation expected to fail')

      const { workflowId } = await transfer({
        userOp: validatedUserOp,
        ...(note && { note: encodeURIComponent(note) }),
      })

      if (workflowId) {
        setIsSheetOpen(false)
        await queryClient.invalidateQueries({
          queryKey: [
            'inter_user_activity_feed',
            otherUserProfile?.sendid,
            currentUserProfile?.send_id,
          ],
        })
      }
    } catch (e) {
      // @TODO: handle sending repeated tx when nonce is still pending
      // if (e.message.includes('Workflow execution already started')) {
      //   router.replace({ pathname: '/', query: { token: sendToken } })
      //   return
      // }
      console.error(e)
      await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
    }
  }

  const noteBorderActiveColor = form.formState.errors.note
    ? '$error'
    : resolvedTheme?.startsWith('dark')
      ? '$primary'
      : '$color12'

  return (
    <XStack w={'100%'} gap={'$4'}>
      <XStack
        f={1}
        gap={'$5'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
          pb: '$3.5',
        }}
        testID={'SendNoteFormContainer'}
      >
        <FormProvider {...form}>
          <SchemaForm
            form={form}
            schema={TransferSchema}
            onSubmit={onSubmit}
            props={{
              amount: {
                height: '$6',
                fontSize: (() => {
                  switch (true) {
                    case !formAmount || formAmount?.length <= 6:
                      return '$14'
                    case formAmount?.length <= 16:
                      return '$10'

                    default:
                      return '$8'
                  }
                })(),
                ta: 'center',
                fontWeight: '500',
                bw: 0,
                br: 0,
                bc: '$color0',
                focusStyle: {
                  outlineWidth: 0,
                },
                placeholder: '0',
                fontFamily: '$mono',
                '$theme-dark': {
                  placeholderTextColor: '$silverChalice',
                },
                '$theme-light': {
                  placeholderTextColor: '$darkGrayTextField',
                },
                inputMode: coin?.decimals ? 'decimal' : 'numeric',
                onChangeText: (amount) => {
                  const localizedAmount = localizeAmount(amount)
                  form.setValue('amount', localizedAmount)
                },
              },
              token: {
                defaultValue: coin?.token,
              },
              note: {
                f: 1,
                ref: noteFieldRef,
                py: '$4',
                pl: '$5',
                fontSize: 17,
                fontStyle: 'normal',
                minHeight: 40,
                placeholder: 'Send a note',
                '$theme-dark': {
                  placeholderTextColor: '$silverChalice',
                },
                '$theme-light': {
                  placeholderTextColor: '$darkGrayTextField',
                },
                focusStyle: {
                  boc: noteBorderActiveColor,
                  bw: 1,
                  outlineWidth: 0,
                  fontStyle: 'normal',
                },
                hoverStyle: {
                  boc: noteBorderActiveColor,
                },
                autoFocus: true,
              },
            }}
            formProps={{
              testID: 'SendForm',
              maw: '100%',
              jc: 'center',
              f: 1,
            }}
            defaultValues={{
              token: coin?.token,
              amount:
                amount && coin !== undefined
                  ? localizeAmount(formatUnits(BigInt(amount), coin.decimals))
                  : undefined,
              note: note || '',
            }}
          >
            {({ amount, token, note }) => (
              <>
                <XStack w="100%" jc="space-around" gap="$2" pb="$3" f={1}>
                  <Button circular als="center" onPress={() => setIsSheetOpen((prev) => !prev)}>
                    <Button.Icon>
                      {isSheetOpen ? (
                        <IconX color="$color11" size="$1" />
                      ) : (
                        <IconPlus color="$color11" size="$1" />
                      )}
                    </Button.Icon>
                  </Button>
                  <YStack>
                    {error && <Paragraph color={'$error'}>{toNiceError(error)}</Paragraph>}
                    {note}
                  </YStack>
                  {(!amount || !sendToken) && !isSheetOpen ? (
                    <Button
                      theme="green"
                      onPress={() => setIsSheetOpen(true)}
                      circular
                      disabledStyle={{ opacity: 0.5 }}
                      als="center"
                      disabled={isLoading || !profileParams.note || !!error}
                    >
                      <Button.Icon>
                        {isLoading ? <Spinner size="small" /> : <IconArrowUp size={'$1.5'} />}
                      </Button.Icon>
                    </Button>
                  ) : (
                    <Button
                      theme="green"
                      onPress={onSubmit}
                      circular
                      disabledStyle={{ opacity: 0.5 }}
                      als="center"
                      disabled={!canSubmit}
                    >
                      <Button.Icon>
                        {isLoading || isSubmitting ? (
                          <Spinner size="small" />
                        ) : (
                          <IconArrowUp size={'$1.5'} />
                        )}
                      </Button.Icon>
                    </Button>
                  )}
                </XStack>
                {isSheetOpen && (
                  <Stack position="relative" h={250}>
                    <Sheet
                      animation={'200ms'}
                      dismissOnSnapToBottom
                      snapPointsMode="constant"
                      snapPoints={[250]}
                      open={isSheetOpen}
                      onOpenChange={setIsSheetOpen}
                    >
                      <Sheet.Frame bc="$color12" padding="$1" alignItems="center" gap="$5">
                        <SheetContents {...{ amount, token }} />
                      </Sheet.Frame>
                    </Sheet>
                  </Stack>
                )}
              </>
            )}
          </SchemaForm>
        </FormProvider>
      </XStack>
    </XStack>
  )
}

// in general good to memoize the contents to avoid expensive renders during animations
const SheetContents = memo(
  ({ amount, token }: { amount: React.ReactNode; token: React.ReactNode }) => {
    const { isLoading: isLoadingCoins } = useCoins()
    const { coin } = useCoinFromSendTokenParam()
    const [profileParams] = useProfileScreenParams()

    const parsedAmount = BigInt(profileParams.amount ?? '0')
    const insufficientAmount =
      coin?.balance !== undefined &&
      profileParams.amount !== undefined &&
      parsedAmount > coin?.balance

    return (
      <Theme inverse>
        <YStack gap="$5" $gtSm={{ p: '$7' }} br={'$6'} p={'$5'} ai={'center'}>
          <YStack position="relative" ai={'center'} gap={'$5'}>
            {token}
            {amount}
          </YStack>
          <XStack jc="space-between">
            <Stack>
              {(() => {
                switch (true) {
                  case isLoadingCoins:
                    return <Spinner size="small" />
                  case !coin?.balance:
                    return null
                  default:
                    return (
                      <XStack gap={'$2'} flexDirection={'column'}>
                        <XStack gap={'$2'}>
                          <Paragraph
                            testID="SendNoteFormBalance"
                            color={insufficientAmount ? '$error' : '$silverChalice'}
                            size={'$5'}
                            $theme-light={{
                              color: insufficientAmount ? '$error' : '$darkGrayTextField',
                            }}
                          >
                            Balance:
                          </Paragraph>
                          <Paragraph
                            color={insufficientAmount ? '$error' : '$color12'}
                            size={'$5'}
                            fontWeight={'600'}
                          >
                            {formatAmount(formatUnits(coin.balance, coin.decimals), 12, 4)}
                          </Paragraph>
                        </XStack>
                        {insufficientAmount && (
                          <Paragraph color={'$error'} size={'$5'}>
                            Insufficient funds
                          </Paragraph>
                        )}
                      </XStack>
                    )
                }
              })()}
            </Stack>
          </XStack>
        </YStack>
      </Theme>
    )
  }
)

SheetContents.displayName = 'ProfileSendSheetContents'

//@TODO Copied from send confirm move this to temporal utils
function useValidateTransferUserOp() {
  return useMutation({
    mutationFn: async (userOp?: UserOperation<'v0.7'>) => {
      if (!userOp?.signature) return null

      try {
        await baseMainnetClient.call({
          account: entryPointAddress[baseMainnetClient.chain.id],
          to: userOp.sender,
          data: userOp.callData,
        })

        const { from, to, token, amount } = decodeTransferUserOp({ userOp })
        if (!from || !to || !amount || !token) {
          log('Failed to decode transfer user op', { from, to, amount, token })
          throw new Error('Not a valid transfer')
        }
        if (!allCoins.find((c) => c.token === token)) {
          log('Token ${token} is not a supported', { token })
          throw new Error(`Token ${token} is not a supported`)
        }
        if (amount < 0n) {
          log('User Operation has amount < 0', { amount })
          throw new Error('User Operation has amount < 0')
        }
        return userOp
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Validation failed')
        throw error
      }
    },
  })
}
