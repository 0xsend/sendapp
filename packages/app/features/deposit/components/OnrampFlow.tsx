import { useState } from 'react'
import { Button, Text, XStack, YStack, Card } from '@my/ui'
import { LinkableButton } from '@my/ui'
import { useForm, FormProvider } from 'react-hook-form'
import { z } from 'zod'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'

interface OnrampFlowProps {
  defaultAmount?: number
  onConfirmTransaction: (amount: number) => void
  isLoading?: boolean
}

const OnrampSchema = z.object({
  amount: formFields.text,
})

export function OnrampFlow({
  defaultAmount = 10,
  onConfirmTransaction,
  isLoading,
}: OnrampFlowProps) {
  const form = useForm<z.infer<typeof OnrampSchema>>()
  const amount = Number(form.watch('amount')) || 0
  const [inputFocused, setInputFocused] = useState(false)

  const handleSubmit = (values: z.infer<typeof OnrampSchema>) => {
    const numAmount = Number(values.amount)
    if (!Number.isNaN(numAmount)) {
      onConfirmTransaction(numAmount)
    }
  }

  return (
    <YStack width="100%" space="$4">
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={OnrampSchema}
          onSubmit={handleSubmit}
          props={{
            amount: {
              keyboardType: 'decimal-pad',
              width: 200,
              fontSize: '$9',
              textAlign: 'left',
              borderWidth: 0,
              backgroundColor: 'transparent',
              color: '$color',
              pl: 0,
              placeholder: '0',
              placeholderTextColor: '$color4',
              onFocus: () => setInputFocused(true),
              onBlur: () => setInputFocused(false),
            },
          }}
          defaultValues={{
            amount: defaultAmount.toString(),
          }}
        >
          {({ amount: amountField }) => (
            <Card bc="$color1" width="100%" p="$6">
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap="$2" flex={1}>
                  <Text fontSize="$9" fontWeight="600" color="$color">
                    $
                  </Text>
                  {amountField}
                </XStack>
                <Text fontSize="$6" color="$color10">
                  USD
                </Text>
              </XStack>

              <YStack height={1} backgroundColor={inputFocused ? '$primary' : '$color'} my="$4" />

              <Text fontSize="$3" color="$color10">
                Min $10 - Max $500 per week
              </Text>
            </Card>
          )}
        </SchemaForm>
      </FormProvider>

      <Button
        theme="green"
        px="$3.5"
        h="$4.5"
        borderRadius="$4"
        f={1}
        disabled={isLoading || amount < 10 || amount > 500}
        opacity={amount >= 10 && amount <= 500 && !isLoading ? 1 : 0.5}
        onPress={form.handleSubmit(handleSubmit)}
      >
        <XStack w="100%" gap="$2.5" ai="center" jc="center">
          <LinkableButton.Text fontWeight="500" tt="uppercase" $theme-dark={{ col: '$color0' }}>
            {isLoading ? 'PROCESSING...' : 'BUY NOW'}
          </LinkableButton.Text>
        </XStack>
      </Button>
    </YStack>
  )
}

export default OnrampFlow
