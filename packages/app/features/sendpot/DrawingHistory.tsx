import { Anchor, H4, Paragraph, Separator, Spinner, Text, XStack, YStack } from '@my/ui'
import { useEffect, useMemo, useState } from 'react'
import { FlatList } from 'react-native'
import {
  useReadBaseJackpotLpPoolTotal,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { formatUnits } from 'viem'
import { baseMainnet } from '@my/wagmi'

import type { Functions } from '@my/supabase/database.types'
import { calculateTicketsFromBps, MAX_JACKPOT_HISTORY, NO_WINNER_ADDRESS } from 'app/data/sendpot'
import { byteaToHex } from 'app/utils/byteaToHex'
import { useUserPendingJackpotTickets } from './hooks/useUserPendingJackpotTickets'
import { useUserJackpotSummary } from './hooks/useUserJackpotSummary'
import { IconCoin } from 'app/components/icons'
import { useTranslation } from 'react-i18next'

export type DrawingHistoryEntry = {
  id: string
  drawDate: string
  prizePool: number
  winner?: string
  winnerFormatted?: string
  winnerTagName?: string
  winnerLink?: string
  totalTicketsPurchased: number
  result?: 'won' | 'lost' | 'pending'
}

const formatBlockTimeToDate = (blockTime: number, fallback: string) => {
  try {
    const date = new Date(blockTime * 1000)
    return date.toLocaleDateString(undefined, {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (e) {
    return fallback
  }
}

export const DrawingHistory = () => {
  const [drawingHistory, setDrawingHistory] = useState<DrawingHistoryEntry[]>([])
  const { t } = useTranslation('sendpot')

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
      const winnerAddress = byteaToHex(run.winner as `\\x${string}`)

      if (userAddressLower && run.winner) {
        resultStatus = winnerAddress.toLowerCase() === userAddressLower ? 'won' : 'lost'
      }

      const historicalPrizePool =
        run.win_amount !== null && run.win_amount !== undefined && tokenDecimals !== undefined
          ? Number.parseFloat(formatUnits(BigInt(run.win_amount), decimals))
          : 0

      const noWinner = winnerAddress === NO_WINNER_ADDRESS
      const winnerTagName = run.winner_tag_name as string | undefined

      let winnerLink: string | undefined
      let winnerDisplayText: string

      if (noWinner) {
        winnerDisplayText = t('history.winner.none')
      } else if (winnerTagName) {
        winnerDisplayText = `/${winnerTagName}`
        winnerLink = `https://send.app/${winnerTagName}`
      } else {
        winnerDisplayText = winnerAddress.substring(0, 10)
        winnerLink = `${baseMainnet.blockExplorers.default.url}/address/${winnerAddress}`
      }

      historicalEntries.push({
        id: `draw-${run.jackpot_run_id}`,
        drawDate: formatBlockTimeToDate(run.jackpot_block_time, t('history.notAvailable')),
        prizePool: historicalPrizePool,
        winner: noWinner ? t('history.winner.none') : winnerAddress,
        winnerFormatted: winnerDisplayText,
        winnerTagName,
        winnerLink,
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
        drawDate: t('history.upcoming'),
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
          drawDate: t('history.upcoming'),
          totalTicketsPurchased: 0,
          result: 'pending',
          prizePool: 0,
          winner: t('history.winner.loading'),
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
    t,
  ])

  const isLoadingInitialData = isLoadingSummary || isLoadingPendingTickets

  const renderDrawingEntry = ({ item }: { item: DrawingHistoryEntry }) => {
    const isCurrent = item.result === 'pending'
    const ticketsBps = item.totalTicketsPurchased
    const actualTickets = calculateTicketsFromBps(ticketsBps)
    const displayPrizePool = item.prizePool
    const winnerLabel = t('history.winner.label')

    const itemIsLoadingCurrent =
      isCurrent && (isLoadingPoolTotal || isLoadingDecimals || isLoadingSendAccount)

    return (
      <YStack gap="$2" py="$3" bc="$color1" br="$4" mb="$3">
        <XStack width="100%" alignItems={'center'}>
          <YStack flex={1} gap="$1">
            {/* Left side: Date, user’s tickets */}
            <H4 fontWeight="600" mt="$1">
              {isCurrent ? t('history.current') : item.drawDate}
            </H4>

            {sendAccount && (
              <Paragraph color="$color10" fos="$3">
                {itemIsLoadingCurrent && isCurrent ? (
                  <Spinner size="small" />
                ) : actualTickets > 0 ? (
                  t('history.tickets.purchased', { count: actualTickets })
                ) : (
                  t('history.tickets.none')
                )}
              </Paragraph>
            )}
          </YStack>

          <YStack flex={1} ai="flex-end" gap="$1">
            {/* Right side: Winner, pool */}
            {isCurrent ? (
              <Paragraph fos="$4" color="$color10" ta="right">
                {winnerLabel}: <Text color={'$color12'}>{t('history.winner.pending')}</Text>
              </Paragraph>
            ) : item.result === 'won' ? (
              <Paragraph fos="$4" color="$color10" ta="right">
                {winnerLabel}:{' '}
                <Text color={'$primary'} $theme-light={{ color: '$olive' }}>
                  {t('history.winner.you')}
                </Text>
              </Paragraph>
            ) : item.winnerLink ? (
              <Paragraph fos="$4" color="$color10" ta="right">
                {winnerLabel}:{' '}
                <Anchor
                  href={item.winnerLink}
                  target="_blank"
                  color="$color12"
                  textDecorationLine="none"
                >
                  {item.winnerFormatted}
                </Anchor>
              </Paragraph>
            ) : (
              <Paragraph fos="$4" color="$color10" ta="right">
                {winnerLabel}: <Text color={'$color12'}>{item.winnerFormatted}</Text>
              </Paragraph>
            )}

            <XStack gap={'$2'} alignItems={'center'}>
              <Paragraph fos="$4" color="$color10" ta="right">
                {t('history.totalPool')}
              </Paragraph>
              <XStack gap={'$1'}>
                <Paragraph>
                  {itemIsLoadingCurrent && isCurrent ? (
                    <Spinner size="small" />
                  ) : displayPrizePool !== undefined ? (
                    <Text color="$color12">
                      {displayPrizePool.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                  ) : (
                    <Text>...</Text>
                  )}
                </Paragraph>
                <IconCoin symbol="SEND" size={'$1'} />
              </XStack>
            </XStack>
          </YStack>
        </XStack>
      </YStack>
    )
  }

  return (
    <YStack gap="$4" w="100%">
      <Paragraph fontSize={'$8'} fontWeight="600" $gtLg={{ fontSize: '$9' }}>
        {t('history.title')}
      </Paragraph>
      <Separator boc={'$color4'} />
      {isLoadingInitialData && drawingHistory.length === 0 ? (
        <YStack ai="center" jc="center">
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
        <YStack ai="center" jc="center">
          <Paragraph color="$color10">{t('history.empty')}</Paragraph>
        </YStack>
      )}
    </YStack>
  )
}
