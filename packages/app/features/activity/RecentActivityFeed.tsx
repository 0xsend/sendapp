import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { isWeb } from '@tamagui/constants'
import type { Activity } from 'app/utils/zod/activity'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { ZodError } from 'zod'
import {
  memo,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { H4, LazyMount, Paragraph, Shimmer, useEvent, View, YStack } from '@my/ui'
import { FlashList } from '@shopify/flash-list'
import { TokenActivityRow } from 'app/features/home/TokenActivityRowV2'
import { useTranslation } from 'react-i18next'
import { SendChat } from 'app/features/send/components/SendChat'
import { useSendScreenParams } from 'app/routers/params'
import { useUser } from 'app/utils/useUser'

export default function ActivityFeed({
  activityFeedQuery,
  onActivityPress,
}: {
  activityFeedQuery: UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError>
  onActivityPress: (activity: Activity) => void
}) {
  const { t, i18n } = useTranslation('activity')

  const [sendChatOpen, setSendChatOpen] = useState(false)
  const sendParamsAndSet = useSendScreenParams()
  const [sendParams, setSendParams] = sendParamsAndSet

  const sendParamsRef = useRef(sendParamsAndSet)
  sendParamsRef.current = sendParamsAndSet

  // biome-ignore lint/correctness/useExhaustiveDependencies: only trigger when sendChatOpen changes
  useEffect(() => {
    if (!sendChatOpen) {
      setTimeout(() => {
        setSendParams({
          idType: undefined,
          recipient: undefined,
          note: undefined,
          amount: sendParams.amount,
          sendToken: sendParams.sendToken,
        })
      }, 400)
    }
  }, [sendChatOpen])

  useEffect(() => {
    if (sendParams.idType && sendParams.recipient) {
      setSendChatOpen(true)
    }
  }, [sendParams.idType, sendParams.recipient])

  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = activityFeedQuery

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPageActivities) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPageActivities])

  const pages = data?.pages
  const locale = i18n.resolvedLanguage ?? i18n.language

  const { flattenedData } = useMemo(() => {
    if (!pages) return { flattenedData: [], stickyIndices: [] }

    const activities = pages.flat()

    // Remove duplicates
    const seenEventIds = new Set<string>()
    const uniqueActivities = activities.filter((activity) => {
      if (seenEventIds.has(activity.event_id)) {
        return false
      }
      seenEventIds.add(activity.event_id)
      return true
    })

    const groups = uniqueActivities.reduce<Record<string, Activity[]>>((acc, activity) => {
      const isToday = activity.created_at.toDateString() === new Date().toDateString()
      const dateKey = isToday
        ? t('sections.today')
        : activity.created_at.toLocaleDateString(locale || undefined, {
            day: 'numeric',
            month: 'long',
          })

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }

      acc[dateKey].push(activity)
      return acc
    }, {})

    const result: ListItem[] = []
    const headerIndices: number[] = []

    Object.entries(groups).forEach(([title, sectionData], sectionIndex) => {
      headerIndices.push(result.length)
      result.push({
        type: 'header',
        title,
        sectionIndex,
      })

      result.push(...sectionData.map((activity) => ({ ...activity, sectionIndex })))
    })

    return { flattenedData: result, stickyIndices: headerIndices }
  }, [pages, t, locale])

  if (isLoadingActivities) {
    return <ListLoadingShimmer />
  }

  if (activitiesError) {
    return (
      <Paragraph maxWidth={600} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
        {activitiesError?.message.split('.').at(0) ?? t('errors.fallback')}
      </Paragraph>
    )
  }

  if (!flattenedData.length) {
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
      $gtLg={{
        y: 20,
      }}
      $platform-native={{
        h: '150%',
        y: 0,
      }}
    >
      <MyList
        data={flattenedData}
        // stickyIndices={stickyIndices}
        onActivityPress={onActivityPress}
        isLoadingActivities={isLoadingActivities}
        isFetchingNextPageActivities={isFetchingNextPageActivities}
        sendParamsRef={sendParamsRef}
        onEndReached={onEndReached}
        hasNextPage={hasNextPage}
      />
      <LazyMount when={sendChatOpen}>
        <SendChat open={sendChatOpen} onOpenChange={setSendChatOpen} />
      </LazyMount>
    </View>
  )
}

type ListItem =
  | (Activity & { sectionIndex: number })
  | { type: 'header'; title: string; sectionIndex: number }

interface MyListProps {
  data: ListItem[]
  stickyIndices?: number[]
  onActivityPress: (activity: Activity) => void
  isLoadingActivities: boolean
  isFetchingNextPageActivities: boolean
  sendParamsRef: React.RefObject<ReturnType<typeof useSendScreenParams>>
  onEndReached: () => void
  hasNextPage: boolean
}

const getItemType = (item: ListItem) => {
  return 'type' in item && item.type === 'header' ? 'header' : 'activity'
}

const keyExtractor = (item: ListItem, index: number): string => {
  if ('type' in item && item.type === 'header') {
    return `header-${item.sectionIndex}-${item.title}-${index}`
  }
  const activity = item as Activity & { sectionIndex: number }
  return activity.event_id
}
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useAddressBook } from 'app/utils/useAddressBook'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { amountFromActivity, eventNameFromActivity, subtextFromActivity } from 'app/utils/activity'
import { CommentsTime } from 'app/utils/dateHelper'
import { Spinner } from '@my/ui'
import {
  isTemporalEthTransfersEvent,
  isTemporalTokenTransfersEvent,
} from 'app/utils/zod/activity/TemporalTransfersEventSchema'
import {
  isSendEarnEvent,
  isSendEarnDepositEvent,
  isTemporalSendEarnDepositEvent,
} from 'app/utils/zod/activity'
import { isSendAccountTransfersEvent } from 'app/utils/zod/activity/SendAccountTransfersEventSchema'
import { isSendAccountReceiveEvent } from 'app/utils/zod/activity/SendAccountReceiveEventSchema'
import { SendEarnAmount } from 'app/features/earn/components/SendEarnAmount'
import { ContractLabels } from 'app/data/contract-labels'
import type { ReactNode } from 'react'

const MyList = memo(
  ({
    data,
    stickyIndices: _stickyIndices,
    onActivityPress,
    isLoadingActivities: _isLoadingActivities,
    isFetchingNextPageActivities: _isFetchingNextPageActivities,
    sendParamsRef,
    onEndReached,
    hasNextPage,
  }: MyListProps) => {
    const { profile } = useUser()

    const { data: swapRouters } = useSwapRouters()
    const { data: liquidityPools } = useLiquidityPools()
    const addressBook = useAddressBook()
    const { t, i18n } = useTranslation('activity')
    const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en'

    const hoverStyles = useHoverStyles()

    const activityComputedValues = useMemo(() => {
      const computed = new Map<
        string,
        {
          amount: ReactNode
          date: ReactNode
          eventName: string
          subtext: string | null
          isUserTransfer: boolean
        }
      >()

      const translator = (key: string, defaultValue?: string, options?: Record<string, unknown>) =>
        t(key, { defaultValue, ...options })

      for (const item of data) {
        if ('type' in item && item.type === 'header') continue

        const activity = item as Activity & { sectionIndex: number }

        const isERC20Transfer = isSendAccountTransfersEvent(activity)
        const isETHReceive = isSendAccountReceiveEvent(activity)
        const isTemporalTransfer =
          isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
        const isUserTransfer =
          (isERC20Transfer || isETHReceive || isTemporalTransfer) &&
          Boolean(activity.to_user?.send_id) &&
          Boolean(activity.from_user?.send_id)

        let eventName: string
        if (
          isSendEarnDepositEvent(activity) &&
          addressBook.data?.[activity.data.sender] === ContractLabels.SendEarnAffiliate
        ) {
          eventName = translator('events.rewards', 'Rewards')
        } else if (
          isERC20Transfer &&
          addressBook.data?.[activity.data.t] === ContractLabels.SendEarn
        ) {
          eventName = translator('events.deposit', 'Deposit')
        } else if (
          isERC20Transfer &&
          addressBook.data?.[activity.data.f] === ContractLabels.SendEarn
        ) {
          eventName = translator('events.withdraw', 'Withdraw')
        } else {
          eventName = eventNameFromActivity({
            activity,
            swapRouters: swapRouters || [],
            liquidityPools: liquidityPools || [],
            t: translator,
          })
        }

        let subtext: string | null
        const sendEarnLabel = translator('subtext.sendEarn', 'Send Earn')
        if (isTemporalSendEarnDepositEvent(activity)) {
          if (activity.data.status === 'failed') {
            subtext = activity.data.error_message || sendEarnLabel
          } else {
            subtext = sendEarnLabel
          }
        } else if (isSendEarnEvent(activity)) {
          subtext = sendEarnLabel
        } else if (isERC20Transfer) {
          if (addressBook.data?.[activity.data.t] === ContractLabels.SendEarn) {
            subtext = sendEarnLabel
          } else if (addressBook.data?.[activity.data.f] === ContractLabels.SendEarn) {
            subtext = sendEarnLabel
          } else {
            subtext = subtextFromActivity({
              activity,
              swapRouters: swapRouters || [],
              liquidityPools: liquidityPools || [],
              t: translator,
            })
          }
        } else {
          subtext = subtextFromActivity({
            activity,
            swapRouters: swapRouters || [],
            liquidityPools: liquidityPools || [],
            t: translator,
          })
        }

        let amount: ReactNode
        if (isSendEarnEvent(activity)) {
          amount = <SendEarnAmount activity={activity} />
        } else {
          amount = amountFromActivity(activity, swapRouters || [], liquidityPools || [])
        }

        let date: ReactNode
        const isTemporalTransferForDate =
          isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
        if (isTemporalTransferForDate) {
          switch (activity.data.status) {
            case 'failed':
              date = translator('status.failed', 'Failed')
              break
            case 'cancelled':
              date = translator('status.cancelled', 'Cancelled')
              break
            case 'confirmed':
              date = CommentsTime(new Date(activity.created_at), locale)
              break
            default:
              date = <Spinner size="small" color={'$color11'} />
          }
        } else {
          date = CommentsTime(new Date(activity.created_at), locale)
        }

        computed.set(activity.event_id, {
          amount,
          date,
          eventName,
          subtext,
          isUserTransfer,
        })
      }

      return computed
    }, [data, swapRouters, liquidityPools, addressBook.data, t, locale])

    const sectionDataMap = useMemo(() => {
      const map = new Map<number, { firstIndex: number; lastIndex: number }>()
      let currentSectionIndex = -1
      let firstIndexInSection = -1

      data.forEach((item, index) => {
        if ('type' in item && item.type === 'header') {
          if (currentSectionIndex >= 0) {
            const prevSection = map.get(currentSectionIndex)
            if (prevSection) {
              prevSection.lastIndex = index - 1
            }
          }
          currentSectionIndex = item.sectionIndex
          firstIndexInSection = index + 1
          map.set(currentSectionIndex, { firstIndex: firstIndexInSection, lastIndex: -1 })
        }
      })

      if (currentSectionIndex >= 0) {
        const lastSection = map.get(currentSectionIndex)
        if (lastSection) {
          lastSection.lastIndex = data.length - 1
        }
      }

      return map
    }, [data])

    const renderItem = useEvent(({ item, index }: { item: ListItem; index: number }) => {
      if ('type' in item && item.type === 'header') {
        return <RowLabel>{item.title}</RowLabel>
      }

      const sectionInfo = sectionDataMap.get(item.sectionIndex)

      const isFirst = sectionInfo?.firstIndex === index
      const isLast = sectionInfo?.lastIndex === index

      const activity = item as Activity
      const computed = activityComputedValues.get(activity.event_id)

      if (!computed) {
        return null
      }

      return (
        <YStack
          bc="$color1"
          p={10}
          h={122}
          mah={122}
          {...(isFirst && {
            borderTopLeftRadius: '$4',
            borderTopRightRadius: '$4',
          })}
          {...(isLast && {
            borderBottomLeftRadius: '$4',
            borderBottomRightRadius: '$4',
          })}
        >
          <TokenActivityRow
            swapRouters={swapRouters}
            liquidityPools={liquidityPools}
            profile={profile}
            activity={activity}
            onPress={onActivityPress}
            sendParamsRef={sendParamsRef}
            addressBook={addressBook}
            hoverStyle={hoverStyles}
            computedAmount={computed.amount}
            computedDate={computed.date}
            computedEventName={computed.eventName}
            computedSubtext={computed.subtext}
            computedIsUserTransfer={computed.isUserTransfer}
          />
        </YStack>
      )
    })

    return (
      <View className="hide-scroll" display="contents">
        <FlashList
          data={data}
          style={styles.flashListStyle}
          testID={'RecentActivity'}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          getItemType={getItemType}
          onEndReached={onEndReached}
          renderItem={renderItem}
          contentContainerStyle={!hasNextPage ? styles.flashListContentContainer : undefined}
          ListFooterComponent={hasNextPage ? <ListFooterComponent /> : null}
        />
      </View>
    )
  }
)

const styles = {
  flashListContentContainer: {
    paddingBottom: !isWeb ? 300 : 200,
  },
  flashListStyle: {
    flex: 1,
  },
} as const

function ListFooterComponent() {
  return (
    <Shimmer
      br={10}
      mt={10}
      componentName="Card"
      $theme-light={{ bg: '$background' }}
      w="100%"
      h={122}
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

MyList.displayName = 'MyList'

function RowLabel({ children }: PropsWithChildren) {
  return (
    <View h={56} w="100%">
      <H4 size="$7" fontWeight="400" py="$3.5" bc="$background" col="$gray11">
        {children}
      </H4>
    </View>
  )
}
