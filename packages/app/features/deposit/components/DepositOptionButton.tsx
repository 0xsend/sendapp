import { Button, Text, XStack, YStack } from '@my/ui'
import { Wallet, Banknote } from '@tamagui/lucide-icons'

interface DepositOptionButtonProps {
  option: 'crypto' | 'card' | 'apple'
  selectedOption: 'crypto' | 'card' | 'apple' | null
  onPress: () => void
  title: string
  description: string
}

export function DepositOptionButton({
  option,
  selectedOption,
  onPress,
  title,
  description,
}: DepositOptionButtonProps) {
  const isSelected = selectedOption === option

  return (
    <Button
      height={80}
      borderRadius="$4"
      backgroundColor={isSelected ? '$backgroundHover' : '$background'}
      position="relative"
      borderWidth={isSelected ? 1 : 0}
      borderColor="$primary"
      onPress={onPress}
    >
      <YStack
        position="absolute"
        left={0}
        top="50%"
        height={40}
        transform={[{ translateY: -20 }]}
        width={4}
        backgroundColor="$primary"
      />
      <XStack ai="center" jc="space-between" width="100%" px="$4">
        <XStack ai="center" gap="$3">
          {option === 'crypto' ? (
            <Wallet size={24} color={isSelected ? '#16a34a' : '#888'} />
          ) : (
            <Banknote size={24} color={isSelected ? '#16a34a' : '#888'} />
          )}
          <YStack>
            <Text fontWeight="500">{title}</Text>
            <Text color="$gray10" fontSize="$3">
              {description}
            </Text>
          </YStack>
        </XStack>
      </XStack>
    </Button>
  )
}
