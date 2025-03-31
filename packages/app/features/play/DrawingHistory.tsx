import { H2, H4, Paragraph, XStack, YStack, Separator, Spinner } from '@my/ui'
import { useState, useEffect, useMemo } from 'react'
import { FlatList } from 'react-native'
import {
  useReadBaseJackpotLpPoolTotal,
  useReadBaseJackpotTokenDecimals,
  useReadBaseJackpotUsersInfo, // Import the hook for user info
} from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { formatUnits, zeroAddress } from 'viem' // Import zeroAddress

// Define the structure for a general drawing history entry
// User-specific details are optional or can be 0
export type DrawingHistoryEntry = {
  id: string // Unique ID for the drawing period
  drawDate: string // Date of the weekly drawing
  prizePool: number // Total prize pool for this drawing
  winner?: string // Address or sendtag of the winner (undefined if pending or no winner yet)
  totalTicketsPurchased: number // Total tickets bought *by the user* for this drawing (can be 0)
  result?: 'won' | 'lost' | 'pending' // Result *for the user* (undefined if not participated)
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  // Using UTC methods to avoid timezone issues if dates are meant to be specific days
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC', // Assuming draw dates are based on UTC or a specific timezone
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Initial mock data *without* the current pending entry
// We will add the current entry dynamically after fetching data
const initialHistory: DrawingHistoryEntry[] = [
  // Previous drawings
  {
    id: 'draw-2025-03-28', // Assuming today is around March 31st, this is the most recent completed draw
    drawDate: '2025-03-28',
    totalTicketsPurchased: 10,
    result: 'lost',
    prizePool: 10000,
    winner: '/Alice', // Example winner sendtag
  },
  {
    id: 'draw-2025-03-21',
    drawDate: '2025-03-21',
    totalTicketsPurchased: 5,
    result: 'won', // User won this one
    prizePool: 8500,
    winner: '0x1234...abcd', // Example winner address (user's address in this case)
  },
  {
    id: 'draw-2025-03-14',
    drawDate: '2025-03-14',
    totalTicketsPurchased: 0, // Example: User did not participate
    result: undefined,
    prizePool: 9200,
    winner: '/Bob', // Example winner sendtag
  },
  {
    id: 'draw-2025-03-07',
    drawDate: '2025-03-07',
    totalTicketsPurchased: 3,
    result: 'lost',
    prizePool: 7800,
    winner: '0x5678...efgh', // Example winner address
  },
]

// Renamed component to reflect general drawing history
export const DrawingHistory = () => {
  const [drawingHistory, setDrawingHistory] = useState<DrawingHistoryEntry[]>(initialHistory)

  // --- Fetch Data ---
  const { data: lpPoolTotal, isLoading: isLoadingPoolTotal } = useReadBaseJackpotLpPoolTotal()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()

  // Fetch user's info (including ticket count) for the current round using the wagmi hook
  const { data: userInfo, isLoading: isLoadingUserInfo } = useReadBaseJackpotUsersInfo({
    userAddress: sendAccount?.address ?? zeroAddress,
  })

  // --- Format Data ---
  const formattedJackpotAmount = useMemo(() => {
    if (typeof lpPoolTotal !== 'bigint' || tokenDecimals === undefined) {
      return undefined // Return undefined when loading or data is missing
    }
    return Number.parseFloat(formatUnits(lpPoolTotal, Number(tokenDecimals)))
  }, [lpPoolTotal, tokenDecimals])

  const currentUserTickets = useMemo(() => {
    // userInfo is a tuple [ticketsPurchasedTotalBps, winningsClaimable, active]
    // Extract ticketsPurchasedTotalBps from the first element (index 0)
    if (
      userInfo &&
      Array.isArray(userInfo) &&
      userInfo.length > 0 &&
      typeof userInfo[0] === 'bigint'
    ) {
      // Assuming ticketsPurchasedTotalBps is the actual count for now.
      // If it's basis points, further calculation might be needed.
      return Number(userInfo[0] / 7000n)
    }
    return undefined // Return undefined if data is not loaded or not in expected format
  }, [userInfo])

  // --- Update State with Current Drawing Info ---
  useEffect(() => {
    // Determine if we have the necessary data to construct the current entry
    const canUpdateCurrent =
      formattedJackpotAmount !== undefined && // Jackpot amount is calculated
      !isLoadingSendAccount && // Send account loading is finished
      (!sendAccount || !isLoadingUserInfo) // If user has account, wait for userInfo query

    if (canUpdateCurrent) {
      const currentEntry: DrawingHistoryEntry = {
        id: 'draw-current', // Use a consistent ID for the current entry
        drawDate: 'Upcoming', // Placeholder date for current
        totalTicketsPurchased: sendAccount ? currentUserTickets ?? 0 : 0, // Use fetched tickets or 0 if no account/loading/error
        result: 'pending',
        prizePool: formattedJackpotAmount ?? 0, // Use formatted amount or 0
      }

      // Update the state by prepending the current entry to the historical data
      setDrawingHistory([currentEntry, ...initialHistory])
    } else {
      // If data isn't ready, ensure the list only shows historical data
      // or potentially a placeholder loading state for the current entry if desired
      setDrawingHistory(initialHistory) // Or potentially add a loading placeholder entry
    }
    // Dependencies: Include all variables that trigger a recalculation/update
  }, [
    formattedJackpotAmount,
    currentUserTickets,
    sendAccount,
    isLoadingSendAccount,
    isLoadingUserInfo, // Correct dependency
  ])

  // Combined loading state for simplicity in rendering
  const isLoadingCurrentData =
    isLoadingPoolTotal || isLoadingDecimals || isLoadingSendAccount || isLoadingUserInfo

  // Render item for the FlatList
  const renderDrawingEntry = ({ item }: { item: DrawingHistoryEntry }) => {
    const isCurrent = item.result === 'pending'
    const displayTickets = isCurrent ? currentUserTickets : item.totalTicketsPurchased
    const displayPrizePool = isCurrent ? formattedJackpotAmount : item.prizePool

    // Determine loading state specifically for this item if it's the current one
    const itemIsLoading = isCurrent && isLoadingCurrentData

    return (
      <YStack gap="$2" py="$3" px="$3.5" bc="$color1" br="$4" mb="$3">
        <XStack jc="space-between" ai="flex-start">
          {/* Left Side: Date/Current and Tickets Purchased */}
          <YStack ai="flex-start" gap="$1">
            <H4 fontWeight="600" mt="$1">
              {isCurrent ? 'Current' : formatDate(item.drawDate)}
            </H4>
            {/* Show ticket purchase info - handle loading/zero state */}
            {/* Show ticket purchase info - handle loading/zero state only if user is logged in */}
            {sendAccount && (
              <Paragraph color="$color10" fos="$3">
                {itemIsLoading ? (
                  <Spinner size="small" />
                ) : displayTickets !== undefined && displayTickets > 0 ? (
                  `You purchased ${displayTickets} ticket${displayTickets !== 1 ? 's' : ''}`
                ) : (
                  'You purchased 0 tickets' // Show 0 if logged in, tickets loaded, and count is 0 or undefined
                )}
              </Paragraph>
            )}
            {/* Don't show ticket info at all if user is not logged in */}
          </YStack>
          {/* Right Side: User Result and Prize Pool stacked */}
          <YStack ai="flex-end" gap="$1">
            {/* Winner Display Logic */}
            {isCurrent ? (
              <Paragraph fos="$5" color="$color10" ta="right">
                Winner: (Pending)
              </Paragraph>
            ) : item.winner ? (
              <Paragraph fos="$5" color="$green10" ta="right">
                Winner: {item.winner}
              </Paragraph>
            ) : null}

            {/* Always show Prize Pool - handle loading state */}
            <Paragraph fos="$4" color="$color10">
              Total Pool:{' '}
              {itemIsLoading ? (
                <Spinner size="small" />
              ) : displayPrizePool !== undefined ? (
                `${displayPrizePool.toLocaleString(undefined, { maximumFractionDigits: 0 })} SEND` // Format with commas
              ) : (
                '... SEND' // Fallback loading text
              )}
            </Paragraph>
          </YStack>
        </XStack>
      </YStack>
    )
  }

  // *** Start of the main component return statement ***
  return (
    <YStack gap="$4" w="100%">
      {/* Removed Active Tickets Section */}

      {/* Drawing History Section - Title Only */}
      <XStack ai="center" jc="space-between">
        <H2 fontWeight="600">Drawing History</H2>
        {/* Removed Toggle Button */}
      </XStack>
      <Separator />

      {/* Always attempt to render list or empty state */}
      {drawingHistory.length > 0 ? (
        <FlatList
          data={drawingHistory}
          renderItem={renderDrawingEntry}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          // Optional: Add ListHeaderComponent or ListFooterComponent if needed
        />
      ) : (
        // Show empty state if no history (or only loading placeholder)
        <YStack ai="center" jc="center" p="$4">
          {isLoadingCurrentData ? (
            <Spinner /> // Show spinner if loading initial history/current data
          ) : (
            <Paragraph color="$color10">No drawing history available.</Paragraph>
          )}
        </YStack>
      )}
    </YStack>
  )
  // *** End of the main component return statement ***
} // Closing brace for the component function
