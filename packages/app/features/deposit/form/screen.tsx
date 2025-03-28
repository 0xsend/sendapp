import { useEffect, useState } from 'react'
import { Button, FadeCard, Paragraph, SubmitButton, XStack, YStack } from '@my/ui'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useDepositScreenParams } from 'app/routers/params'
import { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { formatUnits } from 'viem'
import { useRouter } from 'solito/router'
import { usePathname } from 'app/utils/usePathname'

const DepositFormScreenSchema = z.object({
  depositAmount: formFields.text,
})

export function DepositFormScreen() {
  const router = useRouter()
  const location = usePathname()
  const form = useForm<z.infer<typeof DepositFormScreenSchema>>()
  const [depositParams, setDepositParams] = useDepositScreenParams()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)

  const formDepositAmount = form.watch('depositAmount')
  const parsedDepositAmount = BigInt(depositParams.depositAmount ?? '0')
  const invalidDepositAmount = parsedDepositAmount < 1000n || parsedDepositAmount > 50000n // $10-$500 per week
  const canSubmit = depositParams.depositAmount !== undefined && !invalidDepositAmount

  const handleSubmit = () => {
    router.push({ pathname: `${location}/confirm`, query: depositParams })
  }

  useEffect(() => {
    const subscription = form.watch((values) => {
      const { depositAmount } = values
      const sanitizedDepositAmount = sanitizeAmount(depositAmount, 2)

      setDepositParams(
        {
          ...depositParams,
          depositAmount: sanitizedDepositAmount.toString(),
        },
        { webBehavior: 'replace' }
      )
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [form.watch, depositParams, setDepositParams])

  return (
    <YStack
      w={'100%'}
      gap="$5"
      py={'$3.5'}
      jc={'space-between'}
      $gtLg={{
        w: '50%',
      }}
    >
      <Paragraph size={'$7'}>Enter Deposit Amount</Paragraph>
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={DepositFormScreenSchema}
          onSubmit={handleSubmit}
          props={{
            depositAmount: {
              fontSize: (() => {
                switch (true) {
                  case formDepositAmount?.length > 16:
                    return '$7'
                  case formDepositAmount?.length > 8:
                    return '$8'
                  default:
                    return '$9'
                }
              })(),
              $gtSm: {
                fontSize: (() => {
                  switch (true) {
                    case formDepositAmount?.length <= 9:
                      return '$10'
                    case formDepositAmount?.length > 16:
                      return '$8'
                    default:
                      return '$10'
                  }
                })(),
              },
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
              onChangeText: (depositAmount) => {
                const localizedDepositAmount = localizeAmount(depositAmount)
                form.setValue('depositAmount', localizedDepositAmount)
              },
              onFocus: () => setIsInputFocused(true),
              onBlur: () => setIsInputFocused(false),
              fieldsetProps: {
                flex: 1,
              },
              autoFocus: true,
            },
          }}
          formProps={{
            footerProps: { pb: 0 },
            $gtSm: {
              maxWidth: '100%',
            },
            style: { justifyContent: 'space-between' },
          }}
          defaultValues={{
            depositAmount: depositParams.depositAmount
              ? localizeAmount(formatUnits(BigInt(depositParams.depositAmount), 2))
              : undefined,
          }}
          renderAfter={({ submit }) => (
            <SubmitButton
              theme="green"
              onPress={submit}
              py={'$5'}
              br={'$4'}
              disabledStyle={{ opacity: 0.5 }}
              disabled={!canSubmit}
            >
              <Button.Text
                ff={'$mono'}
                fontWeight={'500'}
                tt="uppercase"
                size={'$5'}
                color={'$black'}
              >
                continue
              </Button.Text>
            </SubmitButton>
          )}
        >
          {({ depositAmount }) => (
            <FadeCard
              bw={'1px'}
              borderColor={formDepositAmount && invalidDepositAmount ? '$error' : 'transparent'}
            >
              <XStack position="relative" jc="space-between" ai="center" gap={'$2'}>
                <XStack gap={'$2'} ai="center" flex={1} overflow={'hidden'}>
                  <Paragraph
                    fontSize={(() => {
                      switch (true) {
                        case formDepositAmount?.length > 16:
                          return '$7'
                        case formDepositAmount?.length > 8:
                          return '$8'
                        default:
                          return '$9'
                      }
                    })()}
                    $gtSm={{
                      fontSize: (() => {
                        switch (true) {
                          case formDepositAmount?.length <= 9:
                            return '$10'
                          case formDepositAmount?.length > 16:
                            return '$8'
                          default:
                            return '$10'
                        }
                      })(),
                    }}
                    fontWeight={500}
                    color={formDepositAmount ? '$color12' : '$darkGrayTextField'}
                  >
                    $
                  </Paragraph>
                  {depositAmount}
                </XStack>
                <Paragraph fontSize="$8" fontWeight={500}>
                  USD
                </Paragraph>
                <XStack
                  position="absolute"
                  bottom={-8}
                  left={0}
                  right={0}
                  height={1}
                  backgroundColor={isInputFocused ? '$primary' : '$darkGrayTextField'}
                  $theme-light={{
                    backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
                  }}
                />
              </XStack>
              <Paragraph
                fontSize="$5"
                color={formDepositAmount && invalidDepositAmount ? '$error' : '$lightGrayTextField'}
                $theme-light={{
                  color:
                    formDepositAmount && invalidDepositAmount ? '$error' : '$darkGrayTextField',
                }}
              >
                Min $10 - Max $500 per week
              </Paragraph>
            </FadeCard>
          )}
        </SchemaForm>
      </FormProvider>
    </YStack>
  )
}

export default DepositFormScreen
