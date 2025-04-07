import { H2, H4, Paragraph, XStack, YStack, Separator, Spinner } from '@my/ui'
import { useState, useEffect, useMemo } from 'react'
import { FlatList } from 'react-native'
import {
  useReadBaseJackpotLpPoolTotal,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot' // Removed useReadBaseJackpotUsersInfo
import { useSendAccount } from 'app/utils/send-accounts'
import { formatUnits } from 'viem' // Removed zeroAddress if unused
import { useUserJackpotSummary } from 'app/utils/useUserJackpotSummary'
import type { Functions } from '@my/supabase/database.types'
import { calculateActualTickets } from 'app/data/sendpot'

// Define the structure for a general drawing history entry
// User-specific details for *past* drawings are no longer available from the hook
export type DrawingHistoryEntry = {
  id: string // Unique ID for the drawing period
  drawDate: string // Date of the weekly drawing
  prizePool: number // Total prize pool for this drawing
  winner?: string // Address or sendtag of the winner (undefined if pending or no winner yet)
  totalTicketsPurchased: number // Total tickets bought *by the user* for this drawing (can be 0) - THIS IS IN BPS
  result?: 'won' | 'lost' | 'pending' // Result *for the user*
}

// Helper function to format dates (or block numbers as fallback)
const formatDateOrBlock = (blockNum: number | null, dateString?: string) => {
  if (dateString && dateString !== 'Upcoming') {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        timeZone: 'UTC', // Assuming draw dates are based on UTC or a specific timezone
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (e) {
      // Fallback if dateString is invalid
    }
  }
  if (blockNum) {
    return `Block ${blockNum}` // Fallback to block number if no valid date
  }
  return 'N/A' // Default fallback
}

// Renamed component to reflect general drawing history
export const DrawingHistory = () => {
  const [drawingHistory, setDrawingHistory] = useState<DrawingHistoryEntry[]>([]) // Start with empty array

  // --- Fetch Data ---
  // Fetch current pool/token info
  const { data: lpPoolTotal, isLoading: isLoadingPoolTotal } = useReadBaseJackpotLpPoolTotal()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()
  // Fetch user account info
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  // Fetch historical jackpot summary data (assuming it might include current)
  const { data: summaryData, isLoading: isLoadingSummary } = useUserJackpotSummary(5)

  // --- Format Current Pool Data ---
  const formattedCurrentJackpotAmount = useMemo(() => {
    if (typeof lpPoolTotal !== 'bigint' || tokenDecimals === undefined) {
      return undefined // Still loading current pool data
    }
    const decimals = tokenDecimals ? Number(tokenDecimals) : 18
    return Number.parseFloat(formatUnits(lpPoolTotal, decimals))
  }, [lpPoolTotal, tokenDecimals])

  // --- Combine and Update State ---
  useEffect(() => {
    // Combine loading states for current pool info
    const isLoadingCurrentPool = isLoadingPoolTotal || isLoadingDecimals

    // Only proceed if summary data is loaded (or errored)
    if (isLoadingSummary) {
      // setDrawingHistory([]); // Optionally clear while loading summary
      return
    }

    const userAddressLower = sendAccount?.address?.toLowerCase()
    const summaryResults =
      (summaryData as Functions<'get_user_jackpot_summary'> | undefined | null) ?? []

    let currentRunData: Functions<'get_user_jackpot_summary'>[number] | undefined = undefined
    const historicalEntries: DrawingHistoryEntry[] = []

    // Process summary results, separating potential current run from historical
    for (const run of summaryResults) {
      // Heuristic to identify current run: winner is null or undefined
      // Adjust this condition if the RPC function has a better way to indicate the current run
      if (run.winner === null || run.winner === undefined) {
        currentRunData = run
      } else {
        // This is a historical run
        const userTicketsBps = run.total_tickets ?? 0 // Assuming this is BPS
        let resultStatus: 'won' | 'lost' | undefined = undefined
        if (userAddressLower && run.winner) {
          if (run.winner.toLowerCase() === userAddressLower) {
            resultStatus = 'won'
          } else if (userTicketsBps > 0) {
            resultStatus = 'lost'
          }
        }
        historicalEntries.push({
          id: `draw-${run.jackpot_run_id}`,
          drawDate: formatDateOrBlock(run.jackpot_block_num),
          prizePool: run.win_amount ?? 0,
          winner: run.winner, // Winner is guaranteed non-null here
          totalTicketsPurchased: userTicketsBps, // Store BPS
          result: resultStatus,
        })
      }
    }

    let combinedHistory = historicalEntries
    const isLoadingCurrentSpecificData = isLoadingSendAccount || isLoadingCurrentPool

    // Determine if we *can* create the current entry display
    // Requires current pool amount and summary data (for tickets) to be loaded
    const canDisplayCurrentEntry = formattedCurrentJackpotAmount !== undefined && !isLoadingSummary

    if (canDisplayCurrentEntry) {
      const currentTicketsBps = currentRunData?.total_tickets ?? 0 // Get tickets BPS from summary if available
      const currentEntry: DrawingHistoryEntry = {
        id: 'draw-current',
        drawDate: 'Upcoming',
        // Use tickets BPS from summary if current run was included, otherwise default to 0
        totalTicketsPurchased: sendAccount ? currentTicketsBps : 0, // Store BPS
        result: 'pending',
        // Use live pool amount for current display
        prizePool: formattedCurrentJackpotAmount ?? 0,
        winner: undefined, // No winner yet
      }
      combinedHistory = [currentEntry, ...historicalEntries]
    } else if (isLoadingCurrentSpecificData || isLoadingSummary) {
      // Add loading placeholder if summary or current pool/account info is still loading
      if (!isLoadingSummary || !isLoadingCurrentPool || !isLoadingSendAccount) {
        // Avoid double loading indicator if initial summary is loading
        const loadingEntry: DrawingHistoryEntry = {
          id: 'draw-current-loading',
          drawDate: 'Upcoming',
          totalTicketsPurchased: 0, // BPS
          result: 'pending',
          prizePool: 0,
          winner: '(Loading...)',
        }
        combinedHistory = [loadingEntry, ...historicalEntries]
      }
    }

    setDrawingHistory(combinedHistory)
  }, [
    summaryData,
    isLoadingSummary,
    formattedCurrentJackpotAmount,
    sendAccount,
    isLoadingSendAccount,
    isLoadingPoolTotal,
    isLoadingDecimals,
  ])

  // Loading state for the initial fetch of summary data
  const isLoadingInitialData = isLoadingSummary

  const renderDrawingEntry = ({ item }: { item: DrawingHistoryEntry }) => {
    const isCurrent = item.result === 'pending'
    // Use totalTicketsPurchased (BPS) directly from item
    const ticketsBps = item.totalTicketsPurchased
    const actualTickets = calculateActualTickets(ticketsBps) // Calculate actual tickets
    const displayPrizePool = item.prizePool

    // Determine loading state specifically for the current item
    // Check based on loading states for current pool and account info
    const itemIsLoadingCurrent =
      isCurrent && (isLoadingPoolTotal || isLoadingDecimals || isLoadingSendAccount)

    return (
      <YStack gap="$2" py="$3" px="$3.5" bc="$color1" br="$4" mb="$3">
        <XStack jc="space-between" ai="flex-start">
          {/* Left Side: Date/Current and Tickets Purchased */}
          <YStack ai="flex-start" gap="$1">
            <H4 fontWeight="600" mt="$1">
              {isCurrent ? 'Current' : formatDateOrBlock(null, item.drawDate)}
            </H4>
            {/* Show ticket purchase info if user is logged in */}
            {sendAccount && (
              <Paragraph color="$color10" fos="$3">
                {/* Handle loading state for current item */}
                {itemIsLoadingCurrent && isCurrent ? ( // Only show spinner for current item loading
                  <Spinner size="small" />
                ) : actualTickets > 0 ? ( // Use actualTickets for display
                  `You purchased ${actualTickets} ticket${actualTickets !== 1 ? 's' : ''}`
                ) : (
                  'You purchased 0 tickets'
                )}
              </Paragraph>
            )}
          </YStack>
          {/* Right Side: Result/Winner and Prize Pool stacked */}
          <YStack ai="flex-end" gap="$1">
            {/* Result/Winner Display Logic */}
            {isCurrent ? (
              <Paragraph fos="$5" color="$color10" ta="right">
                Winner: {item.winner ?? '(Pending)'}
              </Paragraph>
            ) : item.result === 'won' ? (
              <Paragraph fos="$5" color="$green10" ta="right">
                You Won! (Winner: {item.winner})
              </Paragraph>
            ) : item.result === 'lost' ? (
              <Paragraph fos="$5" color="$red10" ta="right">
                Lost (Winner: {item.winner})
              </Paragraph>
            ) : item.winner ? (
              <Paragraph fos="$5" color="$color10" ta="right">
                Winner: {item.winner}
              </Paragraph>
            ) : (
              <Paragraph fos="$5" color="$color10" ta="right">
                Winner: (N/A)
              </Paragraph>
            )}

            {/* Always show Prize Pool - handle loading state for current */}
            <Paragraph fos="$4" color="$color10">
              Total Pool:{' '}
              {itemIsLoadingCurrent && isCurrent ? ( // Only show spinner for current item loading
                <Spinner size="small" />
              ) : displayPrizePool !== undefined ? (
                `${displayPrizePool.toLocaleString(undefined, { maximumFractionDigits: 0 })} SEND`
              ) : (
                '... SEND'
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
      {/* Drawing History Section - Title Only */}
      <XStack ai="center" jc="space-between">
        <H2 fontWeight="600">Drawing History</H2>
      </XStack>
      <Separator />

      {/* Render list or empty/loading state */}
      {isLoadingInitialData && drawingHistory.length === 0 ? (
        // Show spinner only during the initial load of summary data
        <YStack ai="center" jc="center" p="$4">
          <Spinner />
        </YStack>
      ) : drawingHistory.length > 0 ? (
        <FlatList
          data={drawingHistory}
          renderItem={renderDrawingEntry}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // Show empty state if not loading and history is empty
        <YStack ai="center" jc="center" p="$4">
          <Paragraph color="$color10">No drawing history available.</Paragraph>
        </YStack>
      )}
    </YStack>
  )
  // *** End of the main component return statement ***
}
