import { useState } from 'react'
import { Button, Text, XStack, YStack, Input, Card } from '@my/ui'
import { LinkableButton } from '@my/ui'

interface OnrampFlowProps {
  defaultAmount?: number
  onConfirmTransaction: (amount: number) => void
  isLoading?: boolean
}

export function OnrampFlow({
  defaultAmount = 10,
  onConfirmTransaction,
  isLoading,
}: OnrampFlowProps) {
  const [amount, setAmount] = useState(defaultAmount)
  const [inputValue, setInputValue] = useState(defaultAmount.toString())

  const handleInputChange = (value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setInputValue(value)
      const numValue = Number(value)
      if (!Number.isNaN(numValue)) {
        setAmount(numValue)
      }
    }
  }

  return (
    <YStack width="100%" space="$4">
      <Card bc="$color1" width="100%" p="$6">
        <XStack jc="space-between" ai="center">
          <XStack ai="center" gap="$2" flex={1}>
            <Text fontSize="$9" fontWeight="600" color="$color">
              $
            </Text>
            <Input
              value={inputValue}
              onChangeText={handleInputChange}
              keyboardType="decimal-pad"
              width={200}
              fontSize="$9"
              textAlign="left"
              borderWidth={0}
              backgroundColor="transparent"
              color="$color"
              pl={0}
              placeholder="0"
              placeholderTextColor="$color4"
            />
          </XStack>
          <Text fontSize="$6" color="$color10">
            USD
          </Text>
        </XStack>

        <YStack height={1} backgroundColor="$primary" my="$4" />

        <Text fontSize="$3" color="$color10">
          Min $10 - Max $500 per week
        </Text>
      </Card>

      <Button
        theme="green"
        px="$3.5"
        h="$4.5"
        borderRadius="$4"
        f={1}
        disabled={isLoading || amount < 10 || amount > 500}
        opacity={amount >= 10 && amount <= 500 && !isLoading ? 1 : 0.5}
        onPress={() => onConfirmTransaction(amount)}
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
