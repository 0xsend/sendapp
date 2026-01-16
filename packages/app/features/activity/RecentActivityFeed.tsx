/**
 * Activity Feed component using idle-time processing and factory pattern.
 * All computation happens in background via requestIdleCallback.
 * Rendering is just a simple switch on pre-computed typed rows.
 */
import { isServer } from '@tanstack/react-query'
import { isWeb } from '@tamagui/constants'
import {
  memo,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  useDeferredValue,
} from 'react'
import { H4, LazyMount, Paragraph, Shimmer, useThemeName, View, YStack } from '@my/ui'
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet as RNStyleSheet,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useTranslation } from 'react-i18next'
import { SendChat } from 'app/features/send/components/SendChat'
import { useSendScreenParams } from 'app/routers/params'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useActivityDetails } from 'app/provider/activity-details'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useAddressBook } from 'app/utils/useAddressBook'
import {
  type ActivityRow,
  isHeaderRow,
  type ReferralRow,
  useProcessedActivityFeed,
  type UserTransferRow,
} from './utils/useProcessedActivityFeed'
import { ActivityRowFactory, getColors } from './rows/ActivityRowFactory'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { Keyboard } from 'react-native'

// Item heights
const HEADER_HEIGHT = 56
const ACTIVITY_ITEM_HEIGHT = 122

export default function ActivityFeed() {
  const { t, i18n } = useTranslation('activity')
  const { onScroll: onScrollHandler, onContentSizeChange: onContentSizeChangeHandler } =
    useScrollDirection()
  const { selectActivity } = useActivityDetails()

  const [sendChatOpen, setSendChatOpen] = useState(false)
  const sendParamsAndSet = useSendScreenParams()
  const [sendParams, setSendParams] = sendParamsAndSet

  const sendParamsRef = useRef(sendParamsAndSet)
  sendParamsRef.current = sendParamsAndSet

  const {
    data: profile,
    isLoading: isLoadingRecipient,
    error: errorProfileLookup,
  } = useProfileLookup(sendParams.idType ?? 'tag', sendParams.recipient ?? '')

  // to avoid flickering
  const deferredIsLoadingRecipient = useDeferredValue(isLoadingRecipient)
  const finalIsLoading = isLoadingRecipient && deferredIsLoadingRecipient

  // biome-ignore lint/correctness/useExhaustiveDependencies: only trigger when sendChatOpen changes
  useEffect(() => {
    if (!sendChatOpen) {
      const timeoutId = setTimeout(() => {
        setSendParams(
          {
            idType: undefined,
            recipient: undefined,
            note: undefined,
            amount: sendParams.amount,
            sendToken: sendParams.sendToken,
          },
          { webBehavior: 'replace' }
        )
      }, 400)
      return () => clearTimeout(timeoutId)
    }
  }, [sendChatOpen])

  useEffect(() => {
    if (!errorProfileLookup && profile?.address && sendParams.idType && sendParams.recipient) {
      Keyboard.dismiss()
      startTransition(() => {
        setSendChatOpen(true)
      })
    } else {
      setSendChatOpen(false)
    }
  }, [profile, sendParams.idType, sendParams.recipient, errorProfileLookup])

  // Get swap/pool data for preprocessing
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { data: addressBook } = useAddressBook()
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en'

  // Use the processed activity feed hook - all computation happens via requestIdleCallback
  const {
    processedData,
    isProcessing,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
    data,
  } = useProcessedActivityFeed({
    t,
    locale,
    swapRouters,
    liquidityPools,
    addressBook,
  })

  // Build activity lookup map for selectActivity (needed for ActivityDetails)
  const activityMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>['pages'][number][number]>()
    if (!data?.pages) return map
    for (const page of data.pages) {
      for (const activity of page) {
        map.set(activity.event_id, activity)
      }
    }
    return map
  }, [data?.pages])

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPageActivities) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPageActivities])

  const onActivityPress = useCallback(
    (item: ActivityRow) => {
      // For user transfers and referrals, open send chat with counterpart
      if (item.kind === 'user-transfer' || item.kind === 'referral') {
        const row = item as UserTransferRow | ReferralRow
        if (row.counterpartSendId !== null) {
          setSendParams({
            ...sendParams,
            recipient: row.counterpartSendId.toString(),
            idType: 'sendid',
          })
          return
        }
      }
      // For all other activities, show activity details
      if (item.kind !== 'header') {
        const activity = activityMap.get(item.eventId)
        if (activity) {
          selectActivity(activity)
        }
      }
    },
    [sendParams, setSendParams, activityMap, selectActivity]
  )

  // Only show full shimmer on initial load (no data yet)
  // When fetching next page, we keep showing existing data with footer shimmer
  if ((isLoadingActivities || isProcessing) && processedData.length === 0) {
    return <ListLoadingShimmer />
  }

  if (activitiesError) {
    return (
      <Paragraph maxWidth={600} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
        {activitiesError?.message.split('.').at(0) ?? t('errors.fallback')}
      </Paragraph>
    )
  }

  if (!processedData.length) {
    return <RowLabel>{t('empty.noActivities')}</RowLabel>
  }

  return (
    <View
      br={10}
      ov="hidden"
      w="100%"
      pos="absolute"
      h="100%"
      zIndex={10}
      y={-20}
      pe={isLoadingRecipient ? 'none' : 'auto'}
      o={finalIsLoading ? 0.5 : 1}
      $gtLg={{ y: 20 }}
      $platform-native={{ h: '150%', y: 0, animation: '200ms', animateOnly: ['opacity'] }}
      $platform-web={{
        transition: 'opacity 200ms linear',
      }}
    >
      <MyList
        data={processedData}
        onActivityPress={onActivityPress}
        isFetchingNextPage={isFetchingNextPageActivities || isProcessing}
        onEndReached={onEndReached}
        hasNextPage={hasNextPage}
        onScrollHandler={onScrollHandler}
        onContentSizeChangeHandler={onContentSizeChangeHandler}
      />
      <LazyMount when={sendChatOpen}>
        <SendChat open={sendChatOpen} onOpenChange={setSendChatOpen} />
      </LazyMount>
    </View>
  )
}

// Simplified MyList - just renders via factory, no computation
interface MyListProps {
  data: ActivityRow[]
  onEndReached: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onScrollHandler: (e: NativeSyntheticEvent<NativeScrollEvent>, threshold?: number) => void
  onContentSizeChangeHandler?: (w: number, h: number) => void
  onActivityPress: (item: ActivityRow) => void
}

const getItemType = (item: ActivityRow) => item.kind

const keyExtractor = (item: ActivityRow): string => {
  if (isHeaderRow(item)) return `header-${item.sectionIndex}-${item.title}`
  return item.eventId
}

// Memoized row wrapper to avoid creating new onPress functions per render
interface ActivityRowWrapperProps {
  item: Exclude<ActivityRow, { kind: 'header' }>
  colors: ReturnType<typeof getColors>
  isDark: boolean
  onPress: (item: ActivityRow) => void
}

const ActivityRowWrapper = memo(({ item, colors, isDark, onPress }: ActivityRowWrapperProps) => {
  const handlePress = useCallback(() => onPress(item), [onPress, item])

  return (
    <Pressable onPress={handlePress}>
      <YStack
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
        <ActivityRowFactory item={item} colors={colors} isDark={isDark} />
      </YStack>
    </Pressable>
  )
})
ActivityRowWrapper.displayName = 'ActivityRowWrapper'

function isiOSPWA() {
  if (typeof window === 'undefined') return false
  const userAgent = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    //@ts-expect-error window.navigator is not defined in the browser
    const isStandalone = window?.navigator.standalone
    if (isStandalone) {
      return true
    }
    return false
  }
  return false
}

const IS_IOS_PWA = !isServer && isWeb && isiOSPWA()

const MyList = memo(
  ({
    data,
    onEndReached,
    hasNextPage,
    isFetchingNextPage,
    onScrollHandler,
    onContentSizeChangeHandler,
    onActivityPress,
  }: MyListProps) => {
    const theme = useThemeName()
    const isDark = theme.includes('dark')

    // Compute colors once for all rows
    const colors = useMemo(() => getColors(isDark), [isDark])

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (IS_IOS_PWA) return
        onScrollHandler(e)
      },
      [onScrollHandler]
    )

    const overrideItemLayout = useCallback(
      (layout: { span?: number; size?: number }, item: ActivityRow) => {
        layout.size = isHeaderRow(item) ? HEADER_HEIGHT : ACTIVITY_ITEM_HEIGHT
      },
      []
    )

    const renderItem = useCallback(
      ({ item }: { item: ActivityRow }) => {
        if (isHeaderRow(item)) {
          return <ActivityRowFactory item={item} colors={colors} isDark={isDark} />
        }

        return (
          <ActivityRowWrapper
            item={item}
            colors={colors}
            isDark={isDark}
            onPress={onActivityPress}
          />
        )
      },
      [isDark, colors, onActivityPress]
    )

    return (
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        overrideItemLayout={overrideItemLayout}
        onEndReached={onEndReached}
        onScroll={handleScroll}
        onContentSizeChange={onContentSizeChangeHandler}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        drawDistance={500}
        contentContainerStyle={styles.contentContainer}
        ListFooterComponent={hasNextPage || isFetchingNextPage ? <ListFooterComponent /> : null}
      />
    )
  }
)

MyList.displayName = 'MyList'

const styles = RNStyleSheet.create({
  contentContainer: {
    paddingBottom: isWeb ? 0 : 240,
  },
})

function ListFooterComponent() {
  return (
    <Shimmer
      br={10}
      mt={10}
      componentName="Card"
      $theme-light={{ bg: '$background' }}
      w="100%"
      h={isWeb ? 122 : 60}
    />
  )
}

function ListLoadingShimmer() {
  return (
    <YStack w="100%" gap={25}>
      <Shimmer componentName="Card" $theme-light={{ bg: '$background' }} w={100} h={30} />
      <Shimmer br={10} componentName="Card" $theme-light={{ bg: '$background' }} w="100%" h={306} />
    </YStack>
  )
}

function RowLabel({ children }: PropsWithChildren) {
  return (
    <View h={56} w="100%">
      <H4 size="$7" fontWeight="400" py="$3.5" bc="$background" col="$gray11">
        {children}
      </H4>
    </View>
  )
}
