import { Card, Fade, H4, Paragraph, ScrollView, Separator, Spinner, XStack, YStack } from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { isTemporalSendEarnDepositEvent } from 'app/utils/zod/activity'
import { useEffect, useMemo, useRef } from 'react'
import { SectionList } from 'react-native'
import { useSendEarnCoinBalances } from '../hooks'
import { useERC20AssetCoin } from '../params'
import { useEarnActivityFeed } from '../utils/useEarnActivityFeed'
import { useQueryClient } from '@tanstack/react-query'

export const SavingsBalance = () => {
  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} $gtLg={{ w: '50%' }}>
      <YStack gap={'$4'}>
        <TotalSavings />
        <SavingsFeed />
      </YStack>
    </YStack>
  )
}

export const SavingsFeed = () => {
  const coin = useERC20AssetCoin()
  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useEarnActivityFeed({
      pageSize: 10,
    })
  const queryClient = useQueryClient()
  const wasPendingRef = useRef(false) // Ref to track if a pending deposit was seen previously

  useEffect(() => {
    // Only proceed if data is available
    if (!data?.pages) return

    const activities = data.pages.flat()

    // Check if there's currently a pending temporal deposit
    const isCurrentlyPending = activities.some(
      (activity) =>
        isTemporalSendEarnDepositEvent(activity) &&
        // Assuming 'status' is within the 'data' object for this event type
        !['cancelled', 'failed'].includes(activity.data?.status)
    )

    // If it was pending previously but isn't anymore, invalidate the balances query
    if (wasPendingRef.current && !isCurrentlyPending) {
      // Invalidate the query using the base key
      queryClient.invalidateQueries({ queryKey: ['send_earn_balances'] })
    }

    // Update the ref to store the current pending state for the next effect run
    wasPendingRef.current = isCurrentlyPending
  }, [data, queryClient])

  const sections = useMemo(() => {
    if (!data?.pages) return []

    const activities = data.pages.flat()
    const groups = activities.reduce<Record<string, typeof activities>>((acc, activity) => {
      const isToday = new Date(activity.created_at).toDateString() === new Date().toDateString()
      const dateKey = isToday
        ? 'Today'
        : new Date(activity.created_at).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
          })

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }

      acc[dateKey].push(activity)
      return acc
    }, {})

    return Object.entries(groups).map(([title, data], index) => ({
      title,
      data,
      index,
    }))
  }, [data?.pages])

  if (!coin.isSuccess || !coin.data) return null
  if (isLoading) return <Spinner size="small" />
  if (error) return <Paragraph>{error.message}</Paragraph>
  if (!sections.length) return <Paragraph>No earnings activity</Paragraph>

  return (
    <Fade>
      <SectionList
        sections={sections}
        showsVerticalScrollIndicator={false}
        keyExtractor={(activity) => `${activity.event_name}-${activity.created_at.getTime()}`}
        renderItem={({ item: activity, index, section }) => (
          <YStack
            bc="$color1"
            px="$2"
            $gtLg={{
              px: '$3.5',
            }}
            {...(index === 0 && {
              pt: '$2',
              $gtLg: {
                pt: '$3.5',
              },
              borderTopLeftRadius: '$4',
              borderTopRightRadius: '$4',
            })}
            {...(index === section.data.length - 1 && {
              pb: '$2',
              $gtLg: {
                pb: '$3.5',
              },
              borderBottomLeftRadius: '$4',
              borderBottomRightRadius: '$4',
            })}
          >
            <TokenActivityRow activity={activity} />
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
        onEndReached={() => hasNextPage && fetchNextPage()}
        ListFooterComponent={!isLoading && isFetchingNextPage ? <Spinner size="small" /> : null}
        stickySectionHeadersEnabled={true}
      />
    </Fade>
  )
}

function TotalSavings() {
  const coin = useERC20AssetCoin()
  const balances = useSendEarnCoinBalances(coin.data || undefined)
  const totalDeposits = useMemo(() => {
    if (!balances.data) return 0n
    const totalCurrentAssets = balances.data.reduce((acc, balance) => {
      return acc + balance.assets
    }, 0n)
    return totalCurrentAssets
  }, [balances.data])

  const { displayString } = useMemo(() => {
    if (!coin.data || !balances.data) {
      return {
        formattedPrincipal: '0',
        formattedYield: '0',
        formattedTotal: '0',
        displayString: '0',
        yieldAmount: 0n,
      }
    }

    const totalAssets = balances.data.reduce((acc, balance) => {
      return acc + balance.currentAssets
    }, 0n)
    const yieldAmount = totalAssets - totalDeposits
    const formattedPrincipal = formatCoinAmount({ amount: totalDeposits, coin: coin.data })
    const formattedYield = formatCoinAmount({ amount: yieldAmount, coin: coin.data })
    const formattedTotal = formatCoinAmount({ amount: totalAssets, coin: coin.data })

    const displayString =
      yieldAmount > 0n ? `${formattedPrincipal} + ${formattedYield}` : formattedPrincipal

    return { formattedPrincipal, formattedYield, formattedTotal, displayString, yieldAmount }
  }, [balances.data, totalDeposits, coin.data])

  if (!balances.isSuccess || !coin.isSuccess || !coin.data) return null

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <YStack gap={'$4'}>
          <Paragraph size={'$7'}>Balance</Paragraph>
          <YStack gap={'$2'}>
            <Paragraph
              fontWeight={'500'}
              size={displayString.length > 16 ? '$9' : '$11'}
              $gtLg={{
                size: displayString.length > 16 ? '$9' : displayString.length > 8 ? '$10' : '$11',
              }}
            >
              ${displayString}
            </Paragraph>
          </YStack>
        </YStack>
      </Card>
    </Fade>
  )
}
