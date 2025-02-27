import { Button, Card, XStack, Paragraph, YStack, Input } from '@my/ui'
import { ChevronUp, ChevronDown } from '@tamagui/lucide-icons'
import { useState } from 'react'
import type { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native'

type SlippageSelectorProps = {
  value: number
  onSlippageChange: (value: number) => void
}

export default function SlippageSelector({ value, onSlippageChange }: SlippageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCustom, setIsCustom] = useState(false)

  const handleToggle = () => setIsOpen(!isOpen)

  const handleSlippageChange = (newValue: number) => {
    setIsCustom(false)
    onSlippageChange(newValue)
  }

  const handleCustomInputToggle = () => {
    setIsCustom(true)
  }

  const handleCustomInputChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const customValue = e.nativeEvent.text
    const parsedValue = Number.parseFloat(customValue)

    if (!Number.isNaN(parsedValue)) {
      onSlippageChange(parsedValue)
    }
  }

  return (
    <Card padding="$3" backgroundColor="$background" borderRadius="$4" elevate>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        onPress={handleToggle}
        cursor="pointer"
      >
        <Paragraph color="$gray10" fontWeight="bold">
          Max Slippage:
        </Paragraph>
        <XStack alignItems="center" gap="$2">
          <Paragraph fontWeight="bold" color="$gray12">
            {value}%
          </Paragraph>
          {isOpen ? (
            <ChevronUp size={16} color="$gray9" />
          ) : (
            <ChevronDown size={16} color="$gray9" />
          )}
        </XStack>
      </XStack>

      {isOpen && (
        <YStack gap="$2" marginTop="$2">
          <XStack gap="$2" justifyContent="space-between">
            {[0.1, 0.5, 1].map((option) => (
              <Button
                key={option}
                onPress={() => handleSlippageChange(option)}
                backgroundColor={!isCustom && value === option ? '$darkest' : 'transparent'}
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius="$3"
                flex={1}
              >
                <Button.Text fontWeight="bold">{option}%</Button.Text>
              </Button>
            ))}
            <Button
              onPress={handleCustomInputToggle}
              backgroundColor={isCustom ? '$accent' : 'transparent'}
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius="$3"
              flex={1}
            >
              <Button.Text fontWeight={'bold'}>Custom %</Button.Text>
            </Button>
          </XStack>

          {isCustom && (
            <Input
              autoFocus={isCustom}
              placeholder="Enter custom slippage"
              value={value.toString()}
              onChange={handleCustomInputChange}
              keyboardType="numeric"
              borderRadius="$3"
              padding="$2"
              borderColor="$borderColor"
            />
          )}
        </YStack>
      )}
    </Card>
  )
}
