import {
  Fade,
  Paragraph,
  Shake,
  Spinner,
  Stack,
  SubmitButton,
  useAppToast,
  XStack,
  YStack,
} from '@my/ui'
import { entryPointAddress, sendEarnAddress } from '@my/wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { IconCoin } from 'app/components/icons/IconCoin'
import { ReferredBy } from 'app/components/ReferredBy'
import { CalculatedBenefits } from 'app/features/earn/components/CalculatedBenefits'
import { EarnTerms } from 'app/features/earn/components/EarnTerms'
import { useCoin } from 'app/provider/coins'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useSendAccount } from 'app/utils/send-accounts'
import { signUserOp } from 'app/utils/signUserOp'
import { toNiceError } from 'app/utils/toNiceError'
import { useAccountNonce, useUserOp } from 'app/utils/userop'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import debug from 'debug'
import { useCallback, useEffect, useMemo, useState, memo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'
import { useChainId } from 'wagmi'
import { type BRAND, z } from 'zod'
import { useSendEarnCoin } from '../providers/SendEarnProvider'
import {
  coinToParam,
  useAmount,
  useERC20AssetCoin,
  useInitializeFormAmount,
  useParams,
} from '../params'
import { useSendEarnDepositCalls, useSendEarnDepositVault } from './hooks'
import { useSendEarnAPY } from '../hooks'
import { Platform } from 'react-native'

const log = debug('app:earn:deposit')
const MINIMUM_DEPOSIT = BigInt(5 * 1e6) // 5 USDC

const DepositFormSchema = z.object({
  amount: formFields.text,
  areTermsAccepted: formFields.boolean_checkbox,
})
type DepositFormSchema = z.infer<typeof DepositFormSchema>

export function DepositScreen() {
  return <DepositForm />
}

// Memoized balance display to prevent flickering
const DepositBalanceDisplay = memo(
  ({
    coinBalance,
    coinDecimals,
    insufficientAmount,
    isLoading,
  }: {
    coinBalance: bigint | undefined
    coinDecimals: number | undefined
    insufficientAmount: boolean
    isLoading: boolean
  }) => {
    if (isLoading) {
      return <Spinner size="small" />
    }

    if (!coinBalance && coinBalance !== BigInt(0)) {
      return null
    }

    return (
      <XStack gap={'$2'} flexDirection={'column'} $gtSm={{ flexDirection: 'row' }}>
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
            {coinDecimals ? formatAmount(formatUnits(coinBalance, coinDecimals), 12, 2) : '-'}
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
)
DepositBalanceDisplay.displayName = 'DepositBalanceDisplay'

// Memoized benefits display to prevent flickering
const DepositBenefitsDisplay = memo(
  ({
    isError,
    error,
    formattedApy,
    monthlyEarning,
  }: {
    isError: boolean
    error: Error | null
    formattedApy: string | undefined
    monthlyEarning: string | undefined
  }) => {
    if (isError) {
      return <Paragraph color="$error">{toNiceError(error)}</Paragraph>
    }

    // Always show CalculatedBenefits to avoid layout shift
    return (
      <CalculatedBenefits
        apy={formattedApy ?? '...'}
        monthlyEarning={monthlyEarning ?? '...'}
        rewards={''}
        showStaticInfo
      />
    )
  }
)
DepositBenefitsDisplay.displayName = 'DepositBenefitsDisplay'

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
  const { allBalances, coinBalances } = useSendEarnCoin(coin.data ?? undefined)
  const hasExistingDeposit = useMemo(
    () => (coinBalances.data ?? []).some((b) => b.assets > 0n) ?? false,
    [coinBalances.data]
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
    skipGasEstimation: true, // Skip gas estimation - ERC-7677 paymaster will provide gas limits
  })
  const webauthnCreds = useMemo(
    () =>
      sendAccount?.data?.send_account_credentials
        .filter((c) => !!c.webauthn_credentials)
        .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.data?.send_account_credentials]
  )

  // MUTATION DEPOSIT USEROP via Temporal
  const toast = useAppToast()
  const queryClient = useQueryClient()

  const depositMutation = api.sendEarn.deposit.useMutation({
    onMutate: () => {
      log('sendEarn.deposit.onMutate')
    },
    onError: (error) => {
      log('sendEarn.deposit.onError', error)
      toast.error('Deposit Error', {
        message: toNiceError(error),
      })
    },
    onSuccess: (data) => {
      log('sendEarn.deposit.onSuccess', data)
      toast.show('Deposit Submitted', {
        message: 'Your deposit is being processed.',
      })
      if (!coin.data) return

      if (Platform.OS !== 'web') {
        router.back()
      }

      router.replace({
        pathname: `/earn/${coinToParam(coin.data)}/balance`,
      })
    },
    onSettled: () => {
      log('sendEarn.deposit.onSettled')
      // Invalidate queries that might be affected by the deposit starting
      queryClient.invalidateQueries({ queryKey: nonce.queryKey })
      queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: allBalances.queryKey })
      queryClient.invalidateQueries({ queryKey: ['send_earn_balances'] })
    },
  })

  const sponsorUserOpMutation = api.erc7677Paymaster.sponsorUserOperation.useMutation()

  const handleDepositSubmit = useCallback(async () => {
    log('handleDepositSubmit: formState', form.formState)
    assert(Object.keys(form.formState.errors).length === 0, 'form is not valid')
    assert(sender !== undefined, 'sender is not defined')
    assert(calls.isSuccess, 'calls is not success')
    assert(uop.isSuccess, 'uop is not success')

    try {
      // Get paymaster data + gas estimates from CDP via ERC-7677 endpoint
      log('Requesting CDP sponsorship')
      const sponsorResult = await sponsorUserOpMutation.mutateAsync({
        userop: uop.data,
        entryPoint: entryPointAddress[chainId],
      })
      log('CDP sponsorship received', sponsorResult)

      // Update userOp with CDP's paymaster data and gas estimates
      const sponsoredUserOp = {
        ...uop.data,
        ...sponsorResult,
      }

      // Sign with the user's passkey (signature covers all fields including gas)
      sponsoredUserOp.signature = await signUserOp({
        userOp: sponsoredUserOp,
        webauthnCreds,
        chainId: chainId,
        entryPoint: entryPointAddress[chainId],
      })

      await depositMutation.mutateAsync({
        userop: sponsoredUserOp,
        entryPoint: entryPointAddress[chainId],
      })
    } catch (error) {
      log('Error during signing or mutation', error)
      toast.error('Deposit Error', {
        message: toNiceError(error),
      })
    }
  }, [
    form.formState,
    sender,
    calls.isSuccess,
    uop.isSuccess,
    uop.data,
    webauthnCreds,
    chainId,
    depositMutation,
    sponsorUserOpMutation,
    toast,
  ])

  // DEBUG
  log('calls', calls)
  log('depositMutation', depositMutation)

  // Check if amount exceeds available balance
  const insufficientAmount =
    coinBalance.coin?.balance !== undefined &&
    parsedAmount > coinBalance.coin.balance &&
    !depositMutation.isSuccess

  const canSubmit =
    !coin.isLoading &&
    coinBalance.coin?.balance !== undefined &&
    coinBalance.coin.balance >= parsedAmount &&
    parsedAmount > BigInt(0) &&
    calls.isSuccess &&
    !calls.isPending &&
    uop.isSuccess &&
    !uop.isPending &&
    !depositMutation.isPending &&
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

      if (!depositMutation.isSuccess) {
        setParams(
          {
            ...params,
            amount: sanitizedAmount ? sanitizedAmount.toString() : undefined,
          },
          { webBehavior: 'replace' }
        )
      }
    },
    [
      form.clearErrors,
      form.setError,
      setParams,
      coin.data?.decimals,
      params,
      depositMutation.isSuccess,
    ]
  )

  // validate and sanitize amount
  useEffect(() => {
    const subscription = form.watch(({ amount: _amount }) => {
      validateAndSanitizeAmount({ amount: _amount })
    })

    return () => subscription.unsubscribe()
  }, [form.watch, validateAndSanitizeAmount])

  useInitializeFormAmount(form)

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <YStack>
        {[calls.error, uop.error, sendAccount.error].filter(Boolean).map((e) =>
          e ? (
            <Fade key={`error-${e.message}`}>
              <XStack alignItems="center" jc="center" gap={'$2'} role="alert">
                <Paragraph color="$error">{toNiceError(e)}</Paragraph>
              </XStack>
            </Fade>
          ) : null
        )}
        <SubmitButton
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
          disabled={!canSubmit}
        >
          <SubmitButton.Text>CONFIRM DEPOSIT</SubmitButton.Text>
        </SubmitButton>
      </YStack>
    ),
    [calls.error, uop.error, sendAccount.error, areTermsAccepted, form.setError, canSubmit]
  )

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
  const baseApy = useSendEarnAPY({ vault: vault.data ?? platformVault })

  // Memoize formatted APY to prevent unnecessary re-renders
  const formattedApy = useMemo(() => {
    if (baseApy.data?.baseApy === undefined) return undefined
    return formatAmount(baseApy.data.baseApy, undefined, 2)
  }, [baseApy.data?.baseApy])

  const monthlyEarning = useMemo(() => {
    if (!coin.data?.decimals) return undefined
    if (!baseApy.data) return undefined
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
    <YStack
      testID="DepositForm"
      w={'100%'}
      gap={'$4'}
      pb={'$3'}
      f={Platform.OS === 'web' ? undefined : 1}
      $gtLg={{ w: '50%' }}
    >
      <Paragraph size={'$7'} fontWeight={'500'}>
        Deposit Amount
      </Paragraph>
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={DepositFormSchema}
          onSubmit={handleDepositSubmit}
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
            areTermsAccepted: {
              borderWidth: 2,
              borderColor: form.formState.errors.areTermsAccepted ? '$error' : '$borderColor',
              backgroundColor: form.getValues().areTermsAccepted ? '$primary' : '$color1',
            },
          }}
          formProps={{
            testID: 'earning-form',
            $gtSm: {
              maxWidth: '100%',
            },
            // using tamagui props there is bug with justify content set to center after refreshing the page
            style: { justifyContent: 'space-between' },
            footerProps: { p: 0 },
          }}
          defaultValues={{
            amount:
              params.amount && coin.data?.decimals
                ? localizeAmount(formatUnits(BigInt(params.amount), coin.data?.decimals))
                : undefined,
            areTermsAccepted: hasExistingDeposit,
          }}
          renderAfter={renderAfterContent}
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
                  elevation={'$0.75'}
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
                      <DepositBalanceDisplay
                        coinBalance={coinBalance.coin?.balance}
                        coinDecimals={coin.data?.decimals}
                        insufficientAmount={insufficientAmount}
                        isLoading={coin.isLoading || coinBalance.isLoading}
                      />
                    </Stack>
                  </XStack>
                </YStack>
              </Fade>
              <DepositBenefitsDisplay
                isError={baseApy.isError}
                error={baseApy.error}
                formattedApy={formattedApy}
                monthlyEarning={monthlyEarning}
              />
              {/* Only show referred by if there is no existing deposit */}
              {!coinBalances.isLoading && !hasExistingDeposit && <ReferredBy />}
              {hasExistingDeposit ? null : (
                <Shake
                  shakeKey={form.formState.errors.areTermsAccepted ? 'areTermsAccepted' : undefined}
                  baseStyle={{ width: '100%' }}
                >
                  <XStack gap={'$3'} ai={'center'}>
                    {areTermsAccepted}
                    <EarnTerms hasError={!!form.formState.errors.areTermsAccepted} />
                  </XStack>
                </Shake>
              )}
            </YStack>
          )}
        </SchemaForm>
      </FormProvider>
    </YStack>
  )
}
