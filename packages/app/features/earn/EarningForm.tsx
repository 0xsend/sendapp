import {
  Button,
  Card,
  Fade,
  Paragraph,
  Separator,
  Spinner,
  Stack,
  SubmitButton,
  XStack,
  YStack,
} from '@my/ui'
import { z } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useRouter } from 'solito/router'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { formatUnits } from 'viem'
import { useCoin, useCoins } from 'app/provider/coins'
import { useEffect, useState } from 'react'
import { IconCoin } from 'app/components/icons/IconCoin'
import { useEarnScreenParams } from 'app/routers/params'
import { Row } from 'app/features/earn/components/Row'
import { CalculatedBenefits } from 'app/features/earn/components/CalculatedBenefits'
import { EarnTerms } from 'app/features/earn/components/EarnTerms'

const StartEarningSchema = z.object({
  amount: formFields.text,
  areTermsAccepted: formFields.boolean_checkbox,
})

export const EarningForm = () => {
  const form = useForm<z.infer<typeof StartEarningSchema>>()
  const router = useRouter()
  const { coin, isLoading: isUSDCLoading } = useCoin('USDC')
  const { isLoading: isLoadingCoins } = useCoins()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [earnParams, setEarnParams] = useEarnScreenParams()

  const parsedAmount = BigInt(earnParams.amount ?? '0')
  const formAmount = form.watch('amount')
  const areTermsAccepted = form.watch('areTermsAccepted')

  const canSubmit =
    !isUSDCLoading &&
    coin?.balance !== undefined &&
    coin.balance >= parsedAmount &&
    parsedAmount > BigInt(0) &&
    areTermsAccepted

  const insufficientAmount =
    coin?.balance !== undefined && earnParams.amount !== undefined && parsedAmount > coin?.balance

  const onSubmit = async () => {
    if (!canSubmit) return

    // TODO logic for creating vault

    router.push({
      pathname: '/earn',
    })
  }

  useEffect(() => {
    const subscription = form.watch(({ amount: _amount }) => {
      const sanitizedAmount = sanitizeAmount(_amount, coin?.decimals)

      setEarnParams(
        {
          ...earnParams,
          amount: sanitizedAmount.toString(),
        },
        { webBehavior: 'replace' }
      )
    })

    return () => subscription.unsubscribe()
  }, [form.watch, setEarnParams, earnParams, coin?.decimals])

  if (isLoadingCoins || !coin || (!coin.balance && coin.balance !== BigInt(0))) {
    return <Spinner size="large" color={'$color12'} />
  }

  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} $gtLg={{ w: '50%' }}>
      <Paragraph size={'$7'} fontWeight={'500'}>
        Deposit Amount
      </Paragraph>
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={StartEarningSchema}
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
              inputMode: coin?.decimals ? 'decimal' : 'numeric',
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
            testID: 'earning-form',
            $gtSm: {
              maxWidth: '100%',
            },
            // using tamagui props there is bug with justify content set to center after refreshing the page
            style: { justifyContent: 'space-between' },
          }}
          defaultValues={{
            amount: earnParams.amount
              ? localizeAmount(formatUnits(BigInt(earnParams.amount), coin?.decimals))
              : undefined,
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
                  CONFIRM DEPOSIT
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
                      {(() => {
                        switch (true) {
                          case isUSDCLoading:
                            return <Spinner size="small" />
                          case !coin?.balance && coin?.balance !== BigInt(0):
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
                                    {formatAmount(formatUnits(coin.balance, coin?.decimals), 12, 2)}
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
              {parsedAmount > 0 ? (
                // TODO calculate real values
                <CalculatedBenefits apy={'10'} monthlyEarning={'10'} rewards={'3,000'} />
              ) : (
                <StaticBenefits />
              )}
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
              <Row label={'Minimum Deposit'} value={'50 USDC'} />
              <Row label={'Withdraw Anytime'} value={'Full flexibility'} />
              <Row label={'Rewards'} value={'Bonus SEND tokens'} />
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </Fade>
  )
}
