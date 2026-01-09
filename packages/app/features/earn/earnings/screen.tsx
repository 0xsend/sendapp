import {
  Card,
  Fade,
  Paragraph,
  ScrollView,
  Separator,
  Shimmer,
  Spinner,
  useThemeName,
  XStack,
  YStack,
} from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import {
  ActivityRowFactory,
  getAvatarColors,
  getColors,
} from 'app/features/activity/rows/ActivityRowFactory'
import { isHeaderRow } from 'app/features/activity/utils/activityRowTypes'
import { transformActivitiesToRows } from 'app/features/activity/utils/activityTransform'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { useAddressBook } from 'app/utils/useAddressBook'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { isTemporalSendEarnDepositEvent } from 'app/utils/zod/activity'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import { useERC20AssetCoin } from '../params'
import { useSendEarnCoin } from '../providers/SendEarnProvider'
import { useEarnActivityFeed } from '../utils/useEarnActivityFeed'

export const EarningsBalance = () => {
  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} $group-gtLg={{ w: '50%' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        overflow={'visible'}
        overScrollMode={'never'}
      >
        <YStack gap={'$4'}>
          <TotalEarning />
          <Paragraph size={'$7'} fontWeight={'600'}>
            Earnings History
          </Paragraph>
          <EarningsFeed />
        </YStack>
      </ScrollView>
    </YStack>
  )
}

export const EarningsFeed = () => {
  const { t, i18n } = useTranslation('activity')
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en'
  const theme = useThemeName()
  const isDark = theme.includes('dark')

  const coin = useERC20AssetCoin()
  const { invalidateQueries } = useSendEarnCoin(coin.data || undefined)
  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useEarnActivityFeed({
      pageSize: 10,
    })

  // Get data for transform context
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { data: addressBook } = useAddressBook()

  const wasPendingRef = useRef(false)

  useEffect(() => {
    if (!data?.pages) return

    const activities = data.pages.flat()
    const isCurrentlyPending = activities.some(
      (activity) =>
        isTemporalSendEarnDepositEvent(activity) &&
        !['cancelled', 'failed'].includes(activity.data?.status)
    )

    if (wasPendingRef.current && !isCurrentlyPending) {
      invalidateQueries()
    }

    wasPendingRef.current = isCurrentlyPending
  }, [data, invalidateQueries])

  // Transform activities to rows
  const processedData = useMemo(() => {
    if (!data?.pages) return []
    return transformActivitiesToRows(data.pages, {
      t,
      locale,
      swapRouters,
      liquidityPools,
      addressBook,
    })
  }, [data?.pages, t, locale, swapRouters, liquidityPools, addressBook])

  // Compute colors once
  const colors = useMemo(() => getColors(isDark), [isDark])
  const avatarColors = useMemo(() => getAvatarColors(isDark), [isDark])

  // Handle reaching end of list for pagination
  const handleScroll = useMemo(() => {
    if (!hasNextPage || isFetchingNextPage) return undefined
    return () => fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (!coin.isSuccess || !coin.data) return null
  if (isLoading) return <Spinner size="small" />
  if (error) return <Paragraph>{error.message}</Paragraph>
  if (!processedData.length) return <Paragraph>No earnings activity</Paragraph>

  return (
    <Fade>
      <YStack gap="$0">
        {processedData.map((item) => {
          if (isHeaderRow(item)) {
            return (
              <ActivityRowFactory
                key={`header-${item.sectionIndex}-${item.title}`}
                item={item}
                colors={colors}
                avatarColors={avatarColors}
                isDark={isDark}
              />
            )
          }

          return (
            <YStack
              key={item.eventId}
              bc="$color1"
              p={10}
              h={122}
              mah={122}
              {...(item.isFirst && {
                borderTopLeftRadius: '$4',
                borderTopRightRadius: '$4',
              })}
              {...(item.isLast && {
                borderBottomLeftRadius: '$4',
                borderBottomRightRadius: '$4',
              })}
            >
              <ActivityRowFactory
                item={item}
                colors={colors}
                avatarColors={avatarColors}
                isDark={isDark}
              />
            </YStack>
          )
        })}
        {hasNextPage && (
          <XStack jc="center" py="$4">
            {isFetchingNextPage ? (
              <Spinner size="small" />
            ) : (
              <Paragraph
                color="$color10"
                pressStyle={{ opacity: 0.7 }}
                onPress={handleScroll}
                cursor="pointer"
              >
                Load more
              </Paragraph>
            )}
          </XStack>
        )}
      </YStack>
    </Fade>
  )
}

function TotalEarning() {
  const coin = useERC20AssetCoin()
  const { coinBalances } = useSendEarnCoin(coin.data || undefined)
  const totalDeposits = useMemo(() => {
    if (!coinBalances.data) return 0n
    const totalCurrentAssets = coinBalances.data.reduce((acc, balance) => {
      return acc + balance.assets
    }, 0n)
    return totalCurrentAssets
  }, [coinBalances.data])

  const { formattedTotal, displayString } = useMemo(() => {
    if (!coin.data || !coinBalances.data) {
      return {
        formattedPrincipal: '0',
        formattedYield: '0',
        formattedTotal: '0',
        displayString: '0',
        yieldAmount: 0n,
      }
    }

    const totalAssets = coinBalances.data.reduce((acc, balance) => {
      return acc + balance.currentAssets
    }, 0n)
    const yieldAmount = totalAssets - totalDeposits
    const formattedPrincipal = formatCoinAmount({ amount: totalDeposits, coin: coin.data })
    const formattedYield = formatCoinAmount({ amount: yieldAmount, coin: coin.data })
    const formattedTotal = formatCoinAmount({ amount: totalAssets, coin: coin.data })

    const displayString =
      yieldAmount > 0n ? `${formattedPrincipal} + ${formattedYield}` : formattedPrincipal

    return { formattedPrincipal, formattedYield, formattedTotal, displayString, yieldAmount }
  }, [coinBalances.data, totalDeposits, coin.data])

  if (!coinBalances.isSuccess || !coin.isSuccess || !coin.data) return null

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <YStack gap={'$3.5'}>
          <XStack ai={'center'} gap={'$2'}>
            <IconCoin symbol={coin.data.symbol} size={'$2'} />
            <Paragraph size={'$7'} fontWeight={600} lineHeight={28}>
              {coin.data.symbol}
            </Paragraph>
          </XStack>
          <YStack gap={Platform.OS === 'web' ? '$3.5' : '$2'}>
            <Paragraph
              fontWeight={'600'}
              size={displayString.length > 16 ? '$9' : '$11'}
              lineHeight={56}
              $gtLg={{
                size: displayString.length > 16 ? '$9' : displayString.length > 8 ? '$10' : '$11',
              }}
            >
              {displayString}
            </Paragraph>
            <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          </YStack>
          <Paragraph
            size={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            ${formattedTotal} {/* Show total USD value */}
          </Paragraph>
        </YStack>
      </Card>
    </Fade>
  )
}
