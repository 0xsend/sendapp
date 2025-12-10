import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
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
import { H4, isWeb, LazyMount, LinearGradient, Paragraph, Shimmer, View, YStack } from '@my/ui'
import { LegendList } from '@legendapp/list'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'
import { useTranslation } from 'react-i18next'
import { SendChat } from 'app/features/send/components/SendChat'
import { useSendScreenParams } from 'app/routers/params'

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
      setSendParams({
        ...sendParams,
        m: undefined,
      })
    }
  }, [sendChatOpen])

  useEffect(() => {
    if (sendParams.recipient && Number(sendParams.m) === 1) {
      setSendChatOpen(true)
    }
  }, [sendParams.recipient, sendParams.m])

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

    const groups = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
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

    const result: (Activity | { type: 'header'; title: string; sectionIndex: number })[] = []
    const headerIndices: number[] = []

    Object.entries(groups).forEach(([title, sectionData], sectionIndex) => {
      headerIndices.push(result.length)
      result.push({
        type: 'header',
        title,
        sectionIndex,
      })

      result.push(...sectionData)
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
    <View br={10} ov="hidden" w="100%" pos="absolute" h="120%" $gtLg={{ h: '105%' }}>
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
      <LinearGradient
        display="none"
        $gtSm={{
          display: 'flex',
        }}
        animation="100ms"
        animateOnly={['opacity']}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        pe="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        colors={['$background', 'rgba(0, 0, 0, 0)']}
        locations={[0, 1]}
        pos="absolute"
        l={0}
        r={0}
        opacity={0.7}
        h={20}
      />
    </View>
  )
}

type ListItem = Activity | { type: 'header'; title: string; sectionIndex: number }

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

const keyExtractor = (item: ListItem): string => {
  if ('type' in item && item.type === 'header') {
    return `header-${item.sectionIndex}-${item.title}`
  }
  const activity = item as Activity
  return `${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`
}
const getFixedItemSize = (_: number, __: ListItem, type?: string) => {
  if (type === 'header') {
    return 56
  }
  return 122
}

const MyList = memo(
  ({
    data,
    stickyIndices,
    onActivityPress,
    isLoadingActivities,
    isFetchingNextPageActivities,
    sendParamsRef,
    onEndReached,
    hasNextPage,
  }: MyListProps) => {
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

    const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
      if ('type' in item && item.type === 'header') {
        return <RowLabel>{item.title}</RowLabel>
      }

      let sectionInfo: { firstIndex: number; lastIndex: number } | undefined
      for (let i = index; i >= 0; i--) {
        const prevItem = data[i]
        if (!prevItem) continue
        if ('type' in prevItem && prevItem.type === 'header') {
          sectionInfo = sectionDataMap.get(prevItem.sectionIndex)
          break
        }
      }

      const isFirst = sectionInfo?.firstIndex === index
      const isLast = sectionInfo?.lastIndex === index

      return (
        <YStack
          bc="$color1"
          p={10}
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
            activity={item as Activity}
            onPress={onActivityPress}
            sendParamsRef={sendParamsRef}
          />
        </YStack>
      )
    }

    return (
      <View className="hide-scroll" display="contents">
        <LegendList
          data={data}
          testID={'RecentActivity'}
          // stickyHeaderIndices={stickyIndices}
          showsVerticalScrollIndicator={false}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          onEndReached={onEndReached}
          {...(!isWeb && {
            getFixedItemSize: getFixedItemSize,
            estimatedItemSize: 122,
          })}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: hasNextPage ? 0 : 150,
          }}
          ListFooterComponent={
            !isLoadingActivities && isFetchingNextPageActivities ? <ListFooterComponent /> : null
          }
          recycleItems
        />
      </View>
    )
  }
)

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
