import { Button, Text, XStack, YStack, Slider, Input } from '@my/ui'
import { useState, useEffect } from 'react'

interface DepositAmountSelectorProps {
  defaultAmount?: number
  onConfirm: (amount: number) => void
}

export function DepositAmountSelector({
  defaultAmount = 10,
  onConfirm,
}: DepositAmountSelectorProps) {
  const [amount, setAmount] = useState(defaultAmount)
  const [inputValue, setInputValue] = useState(defaultAmount.toString())

  useEffect(() => {
    setInputValue(amount.toString())
  }, [amount])

  const handleInputChange = (value: string) => {
    const numValue = Number.parseFloat(value)
    setInputValue(value)

    if (!Number.isNaN(numValue) && numValue >= 10 && numValue <= 500) {
      setAmount(numValue)
    }
  }

  return (
    <YStack width="100%" ai="center" gap="$6" py="$4">
      <YStack ai="center" gap="$2">
        <Text fontSize="$8" fontWeight="500">
          ${inputValue}
        </Text>
        <Text color="$gray11">Amount to deposit</Text>
      </YStack>

      <YStack width="100%" maxWidth={300} gap="$4">
        <Slider
          value={[amount]}
          min={10}
          max={500}
          step={10}
          onValueChange={([value]) => typeof value === 'number' && setAmount(value)}
          width="100%"
        >
          <Slider.Track>
            <Slider.TrackActive />
          </Slider.Track>
          <Slider.Thumb circular index={0} />
        </Slider>

        <XStack ai="center" jc="center" gap="$2">
          <Text>$</Text>
          <Input
            value={inputValue}
            onChangeText={handleInputChange}
            keyboardType="numeric"
            width={100}
            textAlign="center"
          />
        </XStack>

        <Button
          backgroundColor="$primary"
          color="$color"
          size="$5"
          onPress={() => onConfirm(amount)}
        >
          Confirm Amount
        </Button>
      </YStack>

      <Text fontSize="$3" color="$gray11">
        Min $10 - Max $500 per week
      </Text>
    </YStack>
  )
}
