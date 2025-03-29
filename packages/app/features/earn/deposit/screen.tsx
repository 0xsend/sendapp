import {
  Button,
  Card,
  Fade,
  Paragraph,
  Separator,
  Shake,
  Spinner,
  Stack,
  SubmitButton,
  useToastController,
  XStack,
  YStack,
} from '@my/ui'
import { baseMainnetBundlerClient, entryPointAddress, sendEarnAddress } from '@my/wagmi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconCoin } from 'app/components/icons/IconCoin'
import { ReferredBy } from 'app/components/ReferredBy'
import { usdcCoin } from 'app/data/coins'
import { CalculatedBenefits } from 'app/features/earn/components/CalculatedBenefits'
import { EarnTerms } from 'app/features/earn/components/EarnTerms'
import { Row } from 'app/features/earn/components/Row'
import { useCoin } from 'app/provider/coins'
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
import { type BRAND, z } from 'zod'
import { useSendEarnAPY, useSendEarnBalances, useSendEarnCoinBalances } from '../hooks'
import {
  coinToParam,
  useAmount,
  useERC20AssetCoin,
  useInitializeFormAmount,
  useParams,
} from '../params'
import { useSendEarnDepositCalls, useSendEarnDepositVault } from './hooks'

const log = debug('app:earn:deposit')
const MINIMUM_DEPOSIT = BigInt(10 * 1e6) // 10 USDC

const DepositFormSchema = z.object({
  amount: formFields.text,
  areTermsAccepted: formFields.boolean_checkbox,
})
type DepositFormSchema = z.infer<typeof DepositFormSchema>

export function DepositScreen() {
  return <DepositForm />
}

export function DepositForm() {
  const form = useForm<DepositFormSchema>()
  const router = useRouter()
  const { tokensQuery } = useSendAccountBalances()
  const coin = useERC20AssetCoin()
  const coinBalance = useCoin(coin.data?.symbol)
  const asset = useMemo(() => coin.data?.token, [coin.data?.token])
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const { params, setParams } = useParams()
  const [parsedAmount] = useAmount()
  const formAmount = form.watch('amount')
  const allBalances = useSendEarnBalances()
  const balances = useSendEarnCoinBalances(coin.data ?? undefined)
  const hasExistingDeposit = useMemo(
    () => (balances.data ?? []).some((b) => b.assets > 0n) ?? false,
    [balances.data]
  )
  const areTermsAccepted = form.watch('areTermsAccepted')

  // QUERY DEPOSIT USEROP
  const chainId = useChainId()
  const vault = useSendEarnDepositVault({ asset })
  const platformVault = sendEarnAddress[chainId]
  const sendAccount = useSendAccount()
  const sender = useMemo(() => sendAccount?.data?.address, [sendAccount?.data?.address])
  const nonce = useAccountNonce({ sender })
  const calls = useSendEarnDepositCalls({ sender, asset, amount: parsedAmount })
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

  // MUTATION DEPOSIT USEROP
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

      toast.show('Deposited successfully')
      if (!coin.data) return
      router.push({
        pathname: `/earn/${coinToParam(coin.data)}`,
      })
    },
    onSettled: (data, error, variables, context) => {
      // Error or success... doesn't matter!
      log('onSettled', data, error, variables, context)
      queryClient.invalidateQueries({ queryKey: nonce.queryKey })
      queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: allBalances.queryKey })
    },
  })

  // DEBUG
  log('uop', uop)
  log('calls', calls)
  log('mutation', mutation)

  const insufficientAmount =
    coinBalance.coin?.balance !== undefined &&
    parsedAmount > coinBalance.coin?.balance &&
    !mutation.isSuccess

  const canSubmit =
    !coin.isLoading &&
    coinBalance.coin?.balance !== undefined &&
    coinBalance.coin.balance >= parsedAmount &&
    parsedAmount > BigInt(0) &&
    calls.isSuccess &&
    uop.isSuccess &&
    !calls.isPending &&
    !uop.isPending &&
    !mutation.isPending &&
    !insufficientAmount &&
    Object.keys(form.formState.errors).length === 0

  const validateAndSanitizeAmount = useCallback(
    ({ amount: _amount }: { amount: string | undefined }) => {
      if (!coin.data?.decimals) return
      const sanitizedAmount = sanitizeAmount(_amount, coin.data?.decimals)
      log('sanitizedAmount', sanitizedAmount)
      if (sanitizedAmount !== null && sanitizedAmount < MINIMUM_DEPOSIT) {
        form.setError('amount', {
          type: 'required',
          message: `Minimum deposit is ${formatUnits(MINIMUM_DEPOSIT, coin.data?.decimals)} USDC`,
        })
      } else {
        form.clearErrors('amount')
      }

      if (!mutation.isSuccess) {
        setParams(
          {
            ...params,
            amount: sanitizedAmount ? sanitizedAmount.toString() : undefined,
          },
          { webBehavior: 'replace' }
        )
      }
    },
    [form.clearErrors, form.setError, setParams, coin.data?.decimals, params, mutation.isSuccess]
  )

  // validate and sanitize amount
  useEffect(() => {
    const subscription = form.watch(({ amount: _amount }) => {
      validateAndSanitizeAmount({ amount: _amount })
    })

    return () => subscription.unsubscribe()
  }, [form.watch, validateAndSanitizeAmount])

  useInitializeFormAmount(form)

  // RESET FORM ERRORS for terms or auto accept if user has existing deposit
  useEffect(() => {
    if (hasExistingDeposit) {
      form.setValue('areTermsAccepted', true as boolean & BRAND<'boolean_checkbox'>)
    }
    if (areTermsAccepted && form.formState.errors.areTermsAccepted) {
      form.clearErrors('areTermsAccepted')
    }
  }, [
    form.clearErrors,
    areTermsAccepted,
    form.formState.errors.areTermsAccepted,
    hasExistingDeposit,
    form.setValue,
  ])

  // use deposit vault if it exists, or the default vault for the asset
  const baseApy = useSendEarnAPY({
    vault: vault.data ?? platformVault,
  })

  const monthlyEarning = useMemo(() => {
    if (!coin.data?.decimals) return
    if (!baseApy.data) return
    const decimalAmount = Number(formatUnits(parsedAmount, coin.data?.decimals))
    const monthlyRate = (1 + baseApy.data.baseApy / 100) ** (1 / 12) - 1
    return formatAmount(Number(decimalAmount ?? 0) * monthlyRate)
  }, [baseApy.data, parsedAmount, coin.data?.decimals])

  if (!coin.isLoading && !coin.data) {
    router.push('/earn')
    return null
  }

  log('DepositForm', {
    coin,
    coinBalance,
    formState: form.formState,
    parsedAmount,
    hasExistingDeposit,
    areTermsAccepted,
    insufficientAmount,
  })

  return (
    <YStack testID="DepositForm" w={'100%'} gap={'$4'} pb={'$3'} $gtLg={{ w: '50%' }}>
      <Paragraph size={'$7'} fontWeight={'500'}>
        Deposit Amount
      </Paragraph>
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={DepositFormSchema}
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
              p: '$1',
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
              inputMode: coin.data?.decimals ? 'decimal' : 'numeric',
              onChangeText: (amount: string) => {
                const localizedAmount = localizeAmount(amount)
                form.setValue('amount', localizedAmount)
              },
              onFocus: () => setIsInputFocused(true),
              onBlur: () => setIsInputFocused(false),
              fieldsetProps: {
                flex: 1,
                mr: '$1',
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
            testID: 'earning-form',
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
            areTermsAccepted: hasExistingDeposit,
          }}
          renderAfter={({ submit }) =>
            mutation.isSuccess ? (
              <YStack>
                <Paragraph color={'$color10'} ta="center" size="$3">
                  Success. Redirecting...
                </Paragraph>
              </YStack>
            ) : (
              <YStack>
                {mutation.isPending ? (
                  <Fade key="userop-state">
                    <Paragraph color={'$color10'} ta="center" size="$3">
                      {useropState}
                    </Paragraph>
                  </Fade>
                ) : null}
                {[calls.error, sendAccount.error, uop.error, mutation.error]
                  .filter(Boolean)
                  .map((e) =>
                    e ? (
                      <Fade key="error-state">
                        <XStack
                          alignItems="center"
                          jc="center"
                          gap={'$2'}
                          key={e.message}
                          role="alert"
                        >
                          <Paragraph color="$error">{toNiceError(e)}</Paragraph>
                        </XStack>
                      </Fade>
                    ) : null
                  )}
                <SubmitButton
                  theme="green"
                  onPress={() => {
                    if (!areTermsAccepted) {
                      form.setError(
                        'areTermsAccepted',
                        {
                          type: 'required',
                        },
                        {
                          shouldFocus: true,
                        }
                      )
                      return
                    }
                    submit()
                  }}
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
                    <Button.Text
                      size={'$5'}
                      fontWeight={'500'}
                      fontFamily={'$mono'}
                      color={'$black'}
                    >
                      CONFIRM DEPOSIT
                    </Button.Text>
                  )}
                </SubmitButton>
              </YStack>
            )
          }
        >
          {({ amount, areTermsAccepted }) => (
            <YStack width={'100%'} gap={'$5'}>
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
                      <Paragraph size={'$6'}>{coin.data?.symbol}</Paragraph>
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
                      {(() => {
                        switch (true) {
                          case coin.isLoading || coinBalance.isLoading:
                            return <Spinner size="small" />
                          case !coinBalance.coin?.balance &&
                            coinBalance.coin?.balance !== BigInt(0):
                            return null
                          default:
                            return (
                              <XStack
                                gap={'$2'}
                                flexDirection={'column'}
                                $gtSm={{ flexDirection: 'row' }}
                              >
                                <XStack gap={'$2'}>
                                  <Paragraph
                                    testID="earning-form-balance"
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
                                    {coin.data?.decimals
                                      ? formatAmount(
                                          formatUnits(
                                            coinBalance.coin.balance,
                                            coin.data?.decimals
                                          ),
                                          12,
                                          2
                                        )
                                      : '-'}
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
                        monthlyEarning={monthlyEarning ?? ''}
                        rewards={''}
                      />
                    )
                  default:
                    return <StaticBenefits />
                }
              })()}
              <ReferredBy />
              {hasExistingDeposit ? null : (
                <XStack gap={'$3'} ai={'center'}>
                  {areTermsAccepted}
                  {form.formState.errors.areTermsAccepted ? (
                    <Shake shakeKey="areTermsAccepted" baseStyle={{ width: '100%', flex: 1 }}>
                      <EarnTerms hasError={true} />
                    </Shake>
                  ) : (
                    <EarnTerms />
                  )}
                </XStack>
              )}
            </YStack>
          )}
        </SchemaForm>
      </FormProvider>
    </YStack>
  )
}

const StaticBenefits = () => {
  return (
    <Fade>
      <YStack gap={'$3.5'}>
        <Paragraph size={'$7'} fontWeight={'500'}>
          Benefits
        </Paragraph>
        <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
          <YStack gap={'$3.5'}>
            <XStack gap={'$2.5'} jc={'space-between'}>
              <Paragraph size={'$6'}>APY</Paragraph>
              <Paragraph size={'$6'}>up to 12%</Paragraph>
            </XStack>
            <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
            <YStack gap={'$2'}>
              <Row
                label={'Minimum Deposit'}
                value={formatAmount(formatUnits(MINIMUM_DEPOSIT, usdcCoin.decimals), undefined, 2)}
              />
              <Row label={'Withdraw Anytime'} value={'Full flexibility'} />
              <Row label={'Rewards'} value={'Bonus SEND tokens'} />
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </Fade>
  )
}
