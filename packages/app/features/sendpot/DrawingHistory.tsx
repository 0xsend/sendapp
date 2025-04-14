import { H2, H4, Paragraph, XStack, YStack, Separator, Spinner } from '@my/ui'
import { useState, useEffect, useMemo } from 'react'
import { FlatList } from 'react-native'
import {
  useReadBaseJackpotLpPoolTotal,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { formatUnits } from 'viem'

import type { Functions } from '@my/supabase/database.types'
import { calculateActualTickets, MAX_JACKPOT_HISTORY, NO_WINNER_ADDRESS } from 'app/data/sendpot'
import { byteaToHex } from 'app/utils/byteaToHex'
import { useUserPendingJackpotTickets } from './hooks/useUserPendingJackpotTickets'
import { useUserJackpotSummary } from './hooks/useUserJackpotSummary'

export type DrawingHistoryEntry = {
  id: string
  drawDate: string
  prizePool: number
  winner?: string
  winnerFormatted?: string
  totalTicketsPurchased: number
  result?: 'won' | 'lost' | 'pending'
}

const formatBlockTimeToDate = (blockTime: number) => {
  try {
    const date = new Date(blockTime * 1000)
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (e) {
    return 'N/A'
  }
}

export const DrawingHistory = () => {
  const [drawingHistory, setDrawingHistory] = useState<DrawingHistoryEntry[]>([])

  const { data: lpPoolTotal, isLoading: isLoadingPoolTotal } = useReadBaseJackpotLpPoolTotal()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const { data: summaryData, isLoading: isLoadingSummary } =
    useUserJackpotSummary(MAX_JACKPOT_HISTORY)
  const { data: pendingTicketsData, isLoading: isLoadingPendingTickets } =
    useUserPendingJackpotTickets()

  const formattedCurrentJackpotAmount = useMemo(() => {
    if (typeof lpPoolTotal !== 'bigint' || tokenDecimals === undefined) {
      return undefined
    }
    const decimals = tokenDecimals ? Number(tokenDecimals) : 18
    return Number.parseFloat(formatUnits(lpPoolTotal, decimals))
  }, [lpPoolTotal, tokenDecimals])

  useEffect(() => {
    const isLoadingCurrentPool = isLoadingPoolTotal || isLoadingDecimals
    const decimals = tokenDecimals ? Number(tokenDecimals) : 18

    if (isLoadingSummary) return

    const userAddressLower = sendAccount?.address?.toLowerCase()
    const summaryResults =
      (summaryData as Functions<'get_user_jackpot_summary'> | undefined | null) ?? []
    const historicalEntries: DrawingHistoryEntry[] = []

    for (const run of summaryResults) {
      const userTicketsBps = run.total_tickets ?? 0
      let resultStatus: 'won' | 'lost' | undefined = undefined

      if (userAddressLower && run.winner) {
        resultStatus = run.winner.toLowerCase() === userAddressLower ? 'won' : 'lost'
      }

      const historicalPrizePool =
        run.win_amount !== null && run.win_amount !== undefined && tokenDecimals !== undefined
          ? Number.parseFloat(formatUnits(BigInt(run.win_amount), decimals))
          : 0

      const winnerAddress = byteaToHex(run.winner as `\\x${string}`)
      const noWinner = winnerAddress === NO_WINNER_ADDRESS
      console.log(winnerAddress)
      historicalEntries.push({
        id: `draw-${run.jackpot_run_id}`,
        drawDate: formatBlockTimeToDate(run.jackpot_block_time),
        prizePool: historicalPrizePool,
        winner: noWinner ? 'None' : winnerAddress,
        winnerFormatted: noWinner ? 'None' : winnerAddress.substring(0, 10),
        totalTicketsPurchased: userTicketsBps,
        result: resultStatus,
      })
    }

    let combinedHistory = historicalEntries
    const isLoadingCurrentSpecificData = isLoadingSendAccount || isLoadingCurrentPool
    const canDisplayCurrentEntry =
      formattedCurrentJackpotAmount !== undefined && !isLoadingPendingTickets

    if (canDisplayCurrentEntry) {
      const currentTicketsBps = pendingTicketsData ?? 0
      const currentEntry: DrawingHistoryEntry = {
        id: 'draw-current',
        drawDate: 'Upcoming',
        totalTicketsPurchased: currentTicketsBps,
        result: 'pending',
        prizePool: formattedCurrentJackpotAmount ?? 0,
        winner: undefined,
      }
      combinedHistory = [currentEntry, ...historicalEntries]
    } else if (isLoadingCurrentSpecificData || isLoadingSummary || isLoadingPendingTickets) {
      if (
        !isLoadingSummary ||
        !isLoadingCurrentPool ||
        !isLoadingSendAccount ||
        !isLoadingPendingTickets
      ) {
        const loadingEntry: DrawingHistoryEntry = {
          id: 'draw-current-loading',
          drawDate: 'Upcoming',
          totalTicketsPurchased: 0,
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
    tokenDecimals,
    pendingTicketsData,
    isLoadingPendingTickets,
  ])

  const isLoadingInitialData = isLoadingSummary || isLoadingPendingTickets

  const renderDrawingEntry = ({ item }: { item: DrawingHistoryEntry }) => {
    const isCurrent = item.result === 'pending'
    const ticketsBps = item.totalTicketsPurchased
    const actualTickets = calculateActualTickets(ticketsBps)
    const displayPrizePool = item.prizePool

    const itemIsLoadingCurrent =
      isCurrent && (isLoadingPoolTotal || isLoadingDecimals || isLoadingSendAccount)

    return (
      <YStack gap="$2" py="$3" px="$3.5" bc="$color1" br="$4" mb="$3">
        <XStack width="100%">
          <YStack flex={1} gap="$1">
            {/* Left side: Date, user’s tickets */}
            <H4 fontWeight="600" mt="$1">
              {isCurrent ? 'Current' : item.drawDate}
            </H4>

            {sendAccount && (
              <Paragraph color="$color10" fos="$3">
                {itemIsLoadingCurrent && isCurrent ? (
                  <Spinner size="small" />
                ) : actualTickets > 0 ? (
                  `You purchased ${actualTickets} ticket${actualTickets !== 1 ? 's' : ''}`
                ) : (
                  'You purchased 0 tickets'
                )}
              </Paragraph>
            )}
          </YStack>

          <YStack flex={1} ai="flex-end" gap="$1">
            {/* Right side: Winner, pool */}
            {isCurrent ? (
              <Paragraph fos="$4" color="$color10" ta="right">
                Winner: (Pending)
              </Paragraph>
            ) : item.result === 'won' ? (
              <Paragraph fos="$4" color="$green10" ta="right">
                Winner: You Won!
              </Paragraph>
            ) : (
              <Paragraph fos="$4" color="$color10" ta="right">
                Winner: {item.winnerFormatted}
              </Paragraph>
            )}

            <Paragraph fos="$4" color="$color10" ta="right">
              Total Pool:{' '}
              {itemIsLoadingCurrent && isCurrent ? (
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

  return (
    <YStack gap="$4" w="100%">
      <XStack ai="center" jc="space-between">
        <H2 fontWeight="600">Drawing History</H2>
      </XStack>
      <Separator />
      {isLoadingInitialData && drawingHistory.length === 0 ? (
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
        <YStack ai="center" jc="center" p="$4">
          <Paragraph color="$color10">No drawing history available.</Paragraph>
        </YStack>
      )}
    </YStack>
  )
}
