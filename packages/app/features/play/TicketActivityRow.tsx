import { Paragraph, Text, XStack, YStack } from '@my/ui'
import { Ticket } from '@tamagui/lucide-icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { CommentsTime } from 'app/utils/dateHelper'
import type { TicketEntry } from './TicketHoldings'

export function TicketActivityRow({
  ticket,
  onPress,
}: {
  ticket: TicketEntry
  onPress?: (ticket: TicketEntry) => void
}) {
  const { drawDate, purchaseDate, ticketCount, status, winAmount } = ticket
  const date = CommentsTime(new Date(drawDate))
  const hoverStyles = useHoverStyles()

  // Get status color
  const getStatusColor = (status: TicketEntry['status']) => {
    switch (status) {
      case 'won':
        return '$green10'
      case 'lost':
        return '$color10'
      case 'pending':
        return '$blue10'
      default:
        return '$color10'
    }
  }

  // Get status text
  const getStatusText = (ticket: TicketEntry) => {
    switch (ticket.status) {
      case 'won':
        return `Won ${ticket.winAmount} SEND`
      case 'lost':
        return 'No win'
      case 'pending':
        return 'Draw pending'
      default:
        return ''
    }
  }

  // Get event name based on status
  const getEventName = (status: TicketEntry['status']) => {
    switch (status) {
      case 'won':
        return 'Sendpot Win'
      case 'lost':
        return 'Sendpot Draw'
      case 'pending':
        return 'Sendpot Active'
      default:
        return 'Sendpot Draw'
    }
  }

  return (
    <XStack
      width={'100%'}
      ai="center"
      jc="space-between"
      gap="$4"
      p="$3.5"
      br={'$4'}
      cursor={onPress ? 'pointer' : 'default'}
      $gtLg={{ p: '$5' }}
      testID={'TicketActivityRow'}
      hoverStyle={onPress ? hoverStyles : null}
      onPress={() => onPress?.(ticket)}
    >
      <XStack gap="$3.5" width={'100%'} f={1}>
        <XStack
          width={36}
          height={36}
          br="$4"
          ai="center"
          jc="center"
          backgroundColor={status === 'won' ? '$green2' : '$color2'}
        >
          <Ticket size="$1.5" color={status === 'won' ? '$green10' : '$color10'} />
        </XStack>
        <YStack width={'100%'} f={1} overflow="hidden">
          <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
            <Text color="$color12" fontSize="$6" fontWeight={'500'}>
              {getEventName(status)}
            </Text>
            <Text color="$color12" fontSize="$6" fontWeight={'500'} ta="right">
              {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
            </Text>
          </XStack>
          <XStack
            gap="$1.5"
            alignItems="flex-start"
            justifyContent="space-between"
            width="100%"
            overflow="hidden"
            f={1}
          >
            <Paragraph
              color={getStatusColor(status)}
              fontFamily={'$mono'}
              maxWidth={'100%'}
              overflow={'hidden'}
              fontSize="$5"
            >
              {getStatusText(ticket)}
            </Paragraph>
            <Paragraph color="$color10" size={'$5'} textAlign={'right'}>
              {date}
            </Paragraph>
          </XStack>
        </YStack>
      </XStack>
    </XStack>
  )
}
