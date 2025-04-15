import {
  Button,
  Fade,
  Paragraph,
  Spinner,
  Stack,
  SubmitButton,
  useToastController,
  XStack,
  YStack,
} from '@my/ui'
import { baseMainnetBundlerClient, entryPointAddress } from '@my/wagmi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconCoin } from 'app/components/icons/IconCoin'
import { CalculatedBenefits } from 'app/features/earn/components/CalculatedBenefits'
import {
  useSendEarnAPY,
  useSendEarnBalances,
  useSendEarnCoinBalances,
} from 'app/features/earn/hooks'
import { assert } from 'app/utils/assert'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useSendAccount } from 'app/utils/send-accounts'
import { signUserOp } from 'app/utils/signUserOp'
import { toNiceError } from 'app/utils/toNiceError'
import { useAccountNonce, useUserOp } from 'app/utils/userop'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import debug from 'debug'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { formatUnits, withRetry } from 'viem'
import { useChainId } from 'wagmi'
import { z } from 'zod'
import {
  coinToParam,
  useAmount,
  useERC20AssetCoin,
  useInitializeFormAmount,
  useParams,
} from '../params'
import { useSendEarnWithdrawCalls, useSendEarnWithdrawVault } from './hooks'

export const log = debug('app:earn:withdraw')

const WithdrawFormSchema = z.object({
  amount: formFields.text,
})
type WithdrawFormSchema = z.infer<typeof WithdrawFormSchema>

export function WithdrawScreen() {
  return <WithdrawForm />
}

export function WithdrawForm() {
  const form = useForm<WithdrawFormSchema>()
  const router = useRouter()
  const { tokensQuery } = useSendAccountBalances()
  const coin = useERC20AssetCoin()
  const coinData = useMemo(() => coin.data ?? undefined, [coin.data])
  const asset = useMemo(() => coin.data?.token ?? undefined, [coin.data?.token])
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const { params, setParams } = useParams()
  const [parsedAmount] = useAmount()
  const formAmount = form.watch('amount')
  const allBalances = useSendEarnBalances()

  // QUERY WITHDRAW USEROP
  const chainId = useChainId()
  const vault = useSendEarnWithdrawVault({ asset, coin: coinData })
  const sendAccount = useSendAccount()
  const sender = useMemo(() => sendAccount?.data?.address, [sendAccount?.data?.address])
  const nonce = useAccountNonce({ sender })
  const calls = useSendEarnWithdrawCalls({ sender, asset, amount: parsedAmount, coin: coinData })
  const uop = useUserOp({
    sender,
    calls: calls.data ?? undefined,
  })
  const webauthnCreds = useMemo(
    () =>
      sendAccount?.data?.send_account_credentials
        .filter((c) => !!c.webauthn_credentials)
        .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.data?.send_account_credentials]
  )

  // MUTATION WITHDRAW USEROP
  const [useropState, setUseropState] = useState('')
  const toast = useToastController()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      log('formState', form.formState)
      assert(Object.keys(form.formState.errors).length === 0, 'form is not valid')
      assert(uop.isSuccess, 'uop is not success')

      uop.data.signature = await signUserOp({
        userOp: uop.data,
        webauthnCreds,
        chainId: chainId,
        entryPoint: entryPointAddress[chainId],
      })

      setUseropState('Sending transaction...')

      const userOpHash = await baseMainnetBundlerClient.sendUserOperation({
        userOperation: uop.data,
      })

      setUseropState('Waiting for confirmation...')

      const receipt = await withRetry(
        () =>
          baseMainnetBundlerClient.waitForUserOperationReceipt({
            hash: userOpHash,
            timeout: 10000,
          }),
        {
          delay: 100,
          retryCount: 3,
        }
      )

      log('receipt', receipt)

      assert(receipt.success, 'receipt status is not success')

      log('mutationFn', { uop })
      return
    },
    onMutate: (variables) => {
      // A mutation is about to happen!
      log('onMutate', variables)
      setUseropState('Requesting signature...')
      // Optionally return a context containing data to use when for example rolling back
      // return { id: 1 }
    },
    onError: (error, variables, context) => {
      // An error happened!
      log('onError', error, variables, context)
    },
    onSuccess: (data, variables, context) => {
      // Boom baby!
      log('onSuccess', data, variables, context)

      toast.show('Withdrawn successfully')

      if (coinData) {
        router.push({
          pathname: `/earn/${coinToParam(coinData)}`,
        })
      }
    },
    onSettled: (data, error, variables, context) => {
      // Error or success... doesn't matter!
      log('onSettled', data, error, variables, context)
      queryClient.invalidateQueries({ queryKey: nonce.queryKey })
      queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: allBalances.queryKey })
      queryClient.invalidateQueries({ queryKey: ['send_earn_balances'] })
    },
  })

  // DEBUG
  log('uop', uop)
  log('calls', calls)
  log('mutation', mutation)

  // Fetch the user's deposit balance from Send Earn vaults
  const earnCoinBalances = useSendEarnCoinBalances(coinData)
  const isBalanceLoading = earnCoinBalances.isLoading

  // Calculate the total deposit balance for this coin
  const depositBalance = useMemo(() => {
    if (earnCoinBalances.isLoading || !earnCoinBalances.data) return BigInt(0)

    // Sum up all assets from the balances
    return earnCoinBalances.data.reduce(
      (total, balance) => total + balance.currentAssets,
      BigInt(0)
    )
  }, [earnCoinBalances.data, earnCoinBalances.isLoading])

  const canSubmit =
    !coin.isLoading &&
    depositBalance !== undefined &&
    depositBalance >= parsedAmount &&
    parsedAmount > BigInt(0) &&
    calls.isSuccess &&
    uop.isSuccess &&
    !calls.isPending &&
    !uop.isPending &&
    !mutation.isPending &&
    Object.keys(form.formState.errors).length === 0

  const insufficientAmount = depositBalance !== undefined && parsedAmount > depositBalance

  const validateAndSanitizeAmount = useCallback(
    ({ amount: _amount }: { amount: string | undefined }) => {
      if (!coin.data?.decimals) return
      const sanitizedAmount = sanitizeAmount(_amount, coin.data?.decimals)
      log('sanitizedAmount', sanitizedAmount)

      if (
        sanitizedAmount !== null &&
        depositBalance !== undefined &&
        sanitizedAmount > depositBalance
      ) {
        form.setError('amount', {
          type: 'required',
          message: 'Insufficient funds',
        })
      } else {
        form.clearErrors('amount')
      }

      setParams(
        {
          ...params,
          amount: sanitizedAmount ? sanitizedAmount.toString() : undefined,
        },
        { webBehavior: 'replace' }
      )
    },
    [form.clearErrors, form.setError, setParams, coin.data?.decimals, params, depositBalance]
  )

  // validate and sanitize amount
  useEffect(() => {
    const subscription = form.watch(({ amount: _amount }) => {
      validateAndSanitizeAmount({ amount: _amount })
    })
    return () => subscription.unsubscribe()
  }, [form.watch, validateAndSanitizeAmount])

  useInitializeFormAmount(form)

  // use deposit vault if it exists, or the default vault for the asset
  const baseApy = useSendEarnAPY({
    vault: vault.data ?? undefined,
  })

  // Calculate current monthly earning (before withdrawal)
  const currentMonthlyEarning = useMemo(() => {
    if (!coin.data?.decimals) return
    if (!baseApy.data) return
    const decimalAmount = Number(formatUnits(depositBalance, coin.data?.decimals))
    const monthlyRate = (1 + baseApy.data.baseApy / 100) ** (1 / 12) - 1
    return formatAmount(Number(decimalAmount ?? 0) * monthlyRate)
  }, [baseApy.data, depositBalance, coin.data?.decimals])

  // Calculate reduced monthly earning (after withdrawal)
  const reducedMonthlyEarning = useMemo(() => {
    if (!coin.data?.decimals) return
    if (!baseApy.data) return
    const decimalAmount = Number(formatUnits(depositBalance - parsedAmount, coin.data?.decimals))
    const monthlyRate = (1 + baseApy.data.baseApy / 100) ** (1 / 12) - 1
    return formatAmount(Number(decimalAmount ?? 0) * monthlyRate)
  }, [baseApy.data, parsedAmount, depositBalance, coin.data?.decimals])

  log('WithdrawForm', {
    coin,
    formState: form.formState,
    parsedAmount,
    insufficientAmount,
    depositBalance,
  })

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <YStack>
        {mutation.isPending ? (
          <Fade key="userop-state">
            <Paragraph color={'$color10'} ta="center" size="$3">
              {useropState}
            </Paragraph>
          </Fade>
        ) : null}
        {[calls.error, sendAccount.error, uop.error, mutation.error].filter(Boolean).map((e) =>
          e ? (
            <Fade key="error-state">
              <XStack alignItems="center" jc="center" gap={'$2'} key={e.message} role="alert">
                <Paragraph color="$error">{toNiceError(e)}</Paragraph>
              </XStack>
            </Fade>
          ) : null
        )}
        <SubmitButton
          theme="green"
          onPress={() => submit()}
          py={'$5'}
          br={'$4'}
          disabledStyle={{ opacity: 0.5 }}
          disabled={!canSubmit}
          iconAfter={mutation.isPending ? <Spinner size="small" /> : undefined}
        >
          {[calls.isLoading, sendAccount.isLoading, uop.isLoading].some((p) => p) &&
          !mutation.isPending ? (
            <Spinner size="small" />
          ) : (
            <Button.Text size={'$5'} fontWeight={'500'} fontFamily={'$mono'} color={'$black'}>
              CONFIRM WITHDRAW
            </Button.Text>
          )}
        </SubmitButton>
      </YStack>
    ),
    [
      mutation.isPending,
      useropState,
      calls.error,
      sendAccount.error,
      uop.error,
      mutation.error,
      canSubmit,
      calls.isLoading,
      sendAccount.isLoading,
      uop.isLoading,
    ]
  )

  if (!coin.isLoading && !coin.data) {
    router.push('/earn')
    return null
  }

  if (isBalanceLoading) {
    return <Spinner size="large" color={'$color12'} />
  }
  return (
    <YStack testID="WithdrawForm" w={'100%'} gap={'$4'} $gtLg={{ w: '50%', pb: '$3.5' }}>
      <Paragraph size={'$7'} fontWeight={'500'}>
        Withdraw Amount
      </Paragraph>
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={WithdrawFormSchema}
          onSubmit={() => mutation.mutate()}
          props={{
            amount: {
              fontSize: (() => {
                switch (true) {
                  case formAmount?.length > 12:
                    return '$7'
                  default:
                    return '$9'
                }
              })(),
              color: '$color12',
              fontWeight: '500',
              bw: 0,
              br: 0,
              p: 1,
              focusStyle: {
                outlineWidth: 0,
              },
              placeholder: '0',
              fontFamily: '$mono',
              '$theme-dark': {
                placeholderTextColor: '$darkGrayTextField',
              },
              '$theme-light': {
                placeholderTextColor: '$darkGrayTextField',
              },
              inputMode: 'decimal',
              onChangeText: (amount) => {
                const localizedAmount = localizeAmount(amount)
                form.setValue('amount', localizedAmount)
              },
              onFocus: () => setIsInputFocused(true),
              onBlur: () => setIsInputFocused(false),
              fieldsetProps: {
                width: '70%',
              },
              $gtSm: {
                fontSize: (() => {
                  switch (true) {
                    case formAmount?.length > 14:
                      return '$7'
                    default:
                      return '$9'
                  }
                })(),
              },
            },
          }}
          formProps={{
            testID: 'withdraw-deposit-form',
            footerProps: { pb: 0 },
            $gtSm: {
              maxWidth: '100%',
            },
            // using tamagui props there is bug with justify content set to center after refreshing the page
            style: { justifyContent: 'space-between' },
          }}
          defaultValues={{
            amount:
              params.amount && coin.data?.decimals
                ? localizeAmount(formatUnits(BigInt(params.amount), coin.data?.decimals))
                : undefined,
          }}
          renderAfter={renderAfterContent}
        >
          {({ amount }) => (
            <YStack gap={'$5'}>
              <Fade>
                <YStack
                  gap="$5"
                  $gtSm={{ p: '$7' }}
                  bg={'$color1'}
                  br={'$6'}
                  p={'$5'}
                  borderColor={insufficientAmount ? '$error' : 'transparent'}
                  bw={1}
                >
                  <XStack ai={'center'} position="relative" jc={'space-between'}>
                    {amount}
                    <XStack ai={'center'} gap={'$2'}>
                      <IconCoin symbol={'USDC'} size={'$2'} />
                      <Paragraph size={'$6'}>USDC</Paragraph>
                    </XStack>
                    <XStack
                      position="absolute"
                      bottom={-8}
                      left={0}
                      right={0}
                      height={1}
                      backgroundColor={isInputFocused ? '$primary' : '$silverChalice'}
                      $theme-light={{
                        backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
                      }}
                    />
                  </XStack>
                  <XStack jc="space-between" ai={'flex-start'}>
                    <Stack>
                      <XStack gap={'$2'} flexDirection={'column'} $gtSm={{ flexDirection: 'row' }}>
                        <XStack gap={'$2'}>
                          <Paragraph
                            testID="withdraw-deposit-form-balance"
                            color={insufficientAmount ? '$error' : '$silverChalice'}
                            size={'$5'}
                            $theme-light={{
                              color: insufficientAmount ? '$error' : '$darkGrayTextField',
                            }}
                          >
                            Deposit Balance:
                          </Paragraph>
                          <Paragraph
                            color={insufficientAmount ? '$error' : '$color12'}
                            size={'$5'}
                            fontWeight={'600'}
                          >
                            {coin.data?.decimals
                              ? formatAmount(
                                  formatUnits(depositBalance, coin.data?.decimals),
                                  12,
                                  2
                                )
                              : '-'}
                          </Paragraph>
                          <Paragraph
                            color={insufficientAmount ? '$error' : '$silverChalice'}
                            size={'$5'}
                            $theme-light={{
                              color: insufficientAmount ? '$error' : '$darkGrayTextField',
                            }}
                          >
                            {coin.data?.symbol}
                          </Paragraph>
                        </XStack>
                        {insufficientAmount && (
                          <Paragraph color={'$error'} size={'$5'}>
                            Insufficient funds
                          </Paragraph>
                        )}
                      </XStack>
                    </Stack>
                  </XStack>
                </YStack>
              </Fade>
              {(() => {
                switch (true) {
                  case baseApy.isLoading:
                    return <Spinner size="small" color={'$color12'} />
                  case baseApy.isError:
                    return <Paragraph color="$error">{toNiceError(baseApy.error)}</Paragraph>
                  case baseApy.isSuccess && parsedAmount > 0n:
                    return (
                      <CalculatedBenefits
                        apy={formatAmount(baseApy.data.baseApy, undefined, 2)}
                        monthlyEarning={currentMonthlyEarning ?? ''}
                        rewards={''}
                        overrideMonthlyEarning={
                          parsedAmount > BigInt(0) ? reducedMonthlyEarning : undefined
                        }
                      />
                    )
                  default:
                    return (
                      <CalculatedBenefits
                        apy={formatAmount(baseApy.data?.baseApy ?? 0, undefined, 2)}
                        monthlyEarning={currentMonthlyEarning ?? ''}
                        rewards={''}
                      />
                    )
                }
              })()}
            </YStack>
          )}
        </SchemaForm>
      </FormProvider>
    </YStack>
  )
}
