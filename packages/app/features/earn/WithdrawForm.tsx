import { Button, Fade, Paragraph, Spinner, Stack, SubmitButton, XStack, YStack } from '@my/ui'
import { z } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useRouter } from 'solito/router'
import { useEffect, useState } from 'react'
import { useEarnScreenParams } from 'app/routers/params'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { usdcCoin } from 'app/data/coins'
import { formatUnits } from 'viem'
import { IconCoin } from 'app/components/icons/IconCoin'
import { CalculatedBenefits } from 'app/features/earn/components/CalculatedBenefits'
import { EarnTerms } from 'app/features/earn/components/EarnTerms'

const WithdrawDepositForm = z.object({
  amount: formFields.text,
  areTermsAccepted: formFields.boolean_checkbox,
})

export const WithdrawForm = () => {
  const form = useForm<z.infer<typeof WithdrawDepositForm>>()
  const router = useRouter()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [earnParams, setEarnParams] = useEarnScreenParams()
  const [isFormInitializedFromParams, setIsFormInitializedFromParams] = useState<boolean>(false)

  // TODO fetch real balance
  const depositBalance = BigInt(2780500000)

  const parsedAmount = BigInt(earnParams.amount ?? '0')
  const formAmount = form.watch('amount')
  const areTermsAccepted = form.watch('areTermsAccepted')

  const canSubmit = depositBalance >= parsedAmount && parsedAmount > BigInt(0) && areTermsAccepted

  const insufficientAmount = earnParams.amount !== undefined && parsedAmount > depositBalance

  const onSubmit = async () => {
    if (!canSubmit) return

    // TODO logic for withdrawing from vault

    router.push('/earn/active-earnings')
  }

  useEffect(() => {
    const subscription = form.watch(({ amount: _amount }) => {
      const sanitizedAmount = sanitizeAmount(_amount, usdcCoin.decimals)

      setEarnParams(
        {
          ...earnParams,
          amount: sanitizedAmount.toString(),
        },
        { webBehavior: 'replace' }
      )
    })

    return () => subscription.unsubscribe()
  }, [form.watch, setEarnParams, earnParams])

  useEffect(() => {
    if (!isFormInitializedFromParams && earnParams.amount) {
      form.setValue(
        'amount',
        localizeAmount(formatUnits(BigInt(earnParams.amount), usdcCoin.decimals))
      )

      setIsFormInitializedFromParams(true)
    }
  }, [earnParams.amount, isFormInitializedFromParams, form.setValue])

  // TODO loader when deposit balance is loading
  // if (false) {
  //   return <Spinner size="large" color={'$color12'} />
  // }

  return (
    <YStack w={'100%'} gap={'$4'} py={'$3'} $gtLg={{ w: '50%' }}>
      <Paragraph size={'$7'} fontWeight={'500'}>
        Withdraw Amount
      </Paragraph>
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={WithdrawDepositForm}
          onSubmit={onSubmit}
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
            $gtSm: {
              maxWidth: '100%',
            },
            // using tamagui props there is bug with justify content set to center after refreshing the page
            style: { justifyContent: 'space-between' },
          }}
          defaultValues={{
            amount: undefined,
            areTermsAccepted: false,
          }}
          renderAfter={({ submit }) => (
            <YStack>
              <SubmitButton
                theme="green"
                onPress={submit}
                py={'$5'}
                br={'$4'}
                disabledStyle={{ opacity: 0.5 }}
                disabled={!canSubmit}
              >
                <Button.Text size={'$5'} fontWeight={'500'} fontFamily={'$mono'} color={'$black'}>
                  CONFIRM WITHDRAW
                </Button.Text>
              </SubmitButton>
            </YStack>
          )}
        >
          {({ amount, areTermsAccepted }) => (
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
                            {formatAmount(formatUnits(depositBalance, usdcCoin.decimals), 12, 2)}
                          </Paragraph>
                          <Paragraph
                            color={insufficientAmount ? '$error' : '$silverChalice'}
                            size={'$5'}
                            $theme-light={{
                              color: insufficientAmount ? '$error' : '$darkGrayTextField',
                            }}
                          >
                            USDC
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
              {/*TODO plug real current and override values*/}
              <CalculatedBenefits
                apy={'10'}
                monthlyEarning={'10'}
                rewards={'3,000'}
                overrideApy={parsedAmount > BigInt(0) ? '8' : undefined}
                overrideMonthlyEarning={parsedAmount > BigInt(0) ? '7' : undefined}
                overrideRewards={parsedAmount > BigInt(0) ? '2,100' : undefined}
              />
              <XStack gap={'$3'} ai={'center'}>
                {areTermsAccepted}
                <EarnTerms />
              </XStack>
            </YStack>
          )}
        </SchemaForm>
      </FormProvider>
    </YStack>
  )
}
