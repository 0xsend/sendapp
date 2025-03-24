import { H2, H3, H4, Paragraph, XStack, YStack, Stack, Card, Separator, Button } from '@my/ui'
import { Ticket, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { useState, useMemo } from 'react'
import { TicketActivityRow } from './TicketActivityRow'
import { SectionList } from 'react-native'

export type TicketEntry = {
  id: string
  purchaseDate: string
  ticketCount: number
  drawDate: string
  status: 'pending' | 'won' | 'lost'
  winAmount?: number
}

export const TicketHoldings = () => {
  // State to track if history is expanded
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // Get current date for comparison
  const now = new Date()

  // Mock data - in a real implementation, this would come from an API
  const [tickets, setTickets] = useState<TicketEntry[]>([
    {
      id: '1',
      purchaseDate: '2025-03-20',
      ticketCount: 5,
      drawDate: '2025-03-20',
      status: 'lost',
    },
    {
      id: '2',
      purchaseDate: '2025-03-21',
      ticketCount: 2,
      drawDate: '2025-03-21',
      status: 'won',
      winAmount: 150,
    },
    {
      id: '3',
      purchaseDate: '2025-03-22',
      ticketCount: 3,
      drawDate: '2025-03-22',
      status: 'lost',
    },
    {
      id: '4',
      purchaseDate: '2025-03-23',
      ticketCount: 4,
      drawDate: '2025-03-23',
      status: 'pending',
    },
  ])

  // Calculate active tickets (for the next draw)
  const activeTickets = tickets.filter((ticket) => ticket.status === 'pending')
  const totalActiveTickets = activeTickets.reduce((sum, entry) => sum + entry.ticketCount, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Group tickets by date for the history section
  const sections = useMemo(() => {
    if (!tickets) return []

    const historyTickets = tickets.filter((t) => t.status !== 'pending')
    const groups = historyTickets.reduce<Record<string, TicketEntry[]>>((acc, ticket) => {
      const isToday = new Date(ticket.drawDate).toDateString() === new Date().toDateString()
      const dateKey = isToday
        ? 'Today'
        : new Date(ticket.drawDate).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
          })

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }

      acc[dateKey].push(ticket)
      return acc
    }, {})

    return Object.entries(groups).map(([title, data], index) => ({
      title,
      data,
      index,
    }))
  }, [tickets])

  return (
    <YStack gap="$4" w="100%">
      <XStack ai="center" jc="space-between">
        <H2 fontWeight="600">Active Tickets</H2>
        <XStack ai="center" gap="$2">
          <Ticket size="$1.5" color="$color10" />
          <H3 color="$color12">{totalActiveTickets}</H3>
        </XStack>
      </XStack>

      <XStack ai="center" jc="space-between">
        <Paragraph color="$color10">Price per ticket</Paragraph>
        <Paragraph fontWeight="500">30 SEND</Paragraph>
      </XStack>

      <Separator />

      {activeTickets.length > 0 ? (
        <YStack gap="$3">
          {activeTickets.map((ticket) => (
            <YStack key={ticket.id} bc="$color1" br="$4">
              <TicketActivityRow ticket={ticket} />
            </YStack>
          ))}
        </YStack>
      ) : (
        <YStack ai="center" jc="center" p="$4">
          <Paragraph color="$color10">You don't have any active tickets</Paragraph>
        </YStack>
      )}

      <XStack ai="center" jc="space-between" mt="$4">
        <H2 fontWeight="600">Ticket History</H2>
        <Button
          size="$2"
          chromeless
          p="$2"
          br="$4"
          onPress={() => setHistoryExpanded(!historyExpanded)}
        >
          {historyExpanded ? (
            <XStack ai="center" gap="$1">
              <Paragraph color="$color10">Hide</Paragraph>
              <ChevronUp size="$1" color="$color10" />
            </XStack>
          ) : (
            <XStack ai="center" gap="$1">
              <Paragraph color="$color10">Show</Paragraph>
              <ChevronDown size="$1" color="$color10" />
            </XStack>
          )}
        </Button>
      </XStack>
      <Separator />

      {historyExpanded && sections.length > 0 ? (
        <SectionList
          sections={sections}
          testID={'TicketHistory'}
          showsVerticalScrollIndicator={false}
          keyExtractor={(ticket) => ticket.id}
          renderItem={({ item: ticket }) => (
            <YStack
              bc="$color1"
              px="$2"
              $gtLg={{
                px: '$3.5',
              }}
            >
              <TicketActivityRow ticket={ticket} />
            </YStack>
          )}
          renderSectionHeader={({ section: { title, index } }) => (
            <H4
              fontWeight={'600'}
              size={'$7'}
              pt={index === 0 ? 0 : '$3.5'}
              pb="$3.5"
              bc="$background"
            >
              {title}
            </H4>
          )}
          stickySectionHeadersEnabled={true}
        />
      ) : historyExpanded ? (
        <YStack ai="center" jc="center" p="$4">
          <Paragraph color="$color10">No ticket history yet</Paragraph>
        </YStack>
      ) : (
        <YStack ai="center" jc="center" p="$4">
          <Paragraph color="$color10">
            {sections.length > 0
              ? `${sections.reduce((sum, section) => sum + section.data.length, 0)} past tickets`
              : 'No ticket history yet'}
          </Paragraph>
        </YStack>
      )}

      {/* Price per ticket is now shown at the top */}
    </YStack>
  )
}
