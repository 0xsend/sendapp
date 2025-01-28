import { Button, XStack, Popover } from '@my/ui'
import { ChevronDown } from '@tamagui/lucide-icons'
import type { CoinWithBalance } from 'app/data/coins'
import TokenItem from './TokenItem'

interface PopoverItemProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selectedToken: CoinWithBalance
  coins: CoinWithBalance[]
  onTokenChange: (token: CoinWithBalance) => void
  testID: string
}

export default function PopoverItem({
  isOpen,
  onOpenChange,
  selectedToken,
  coins,
  onTokenChange,
  testID,
}: PopoverItemProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <Button
          testID={testID}
          chromeless
          size="$3"
          position="absolute"
          right={0}
          p={0}
          backgroundColor="transparent"
          borderWidth={0}
          hoverStyle={{ backgroundColor: 'transparent' }}
        >
          <TokenItem coin={selectedToken} />
          <ChevronDown size={16} color="$green5" />
        </Button>
      </Popover.Trigger>
      <Popover.Content p={0} mt="$2" bg="$color2" br="$2" elevate width="100%" overflow="hidden">
        {coins.map((token) => (
          <XStack
            key={token.token}
            cursor="pointer"
            jc="space-between"
            ai="center"
            py="$3"
            px="$5"
            w="100%"
            onPress={() => onTokenChange(token)}
            hoverStyle={{ bg: '$color3' }}
          >
            <TokenItem coin={token} />
          </XStack>
        ))}
      </Popover.Content>
    </Popover>
  )
}
