import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { Activity } from 'app/utils/zod/activity'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { ZodError } from 'zod'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { memo, type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { H4, LazyMount, Paragraph, Spinner, View, YStack } from '@my/ui'
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
  const { isAtEnd } = useScrollDirection()
  const { t, i18n } = useTranslation('activity')

  const [sendChatOpen, setSendChatOpen] = useState(false)
  const [sendParams, setSendParams] = useSendScreenParams()

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

  useEffect(() => {
    if (isAtEnd && hasNextPage && !isFetchingNextPageActivities) {
      fetchNextPage()
    }
  }, [isAtEnd, hasNextPage, fetchNextPage, isFetchingNextPageActivities])

  const pages = data?.pages
  const locale = i18n.resolvedLanguage ?? i18n.language

  const { flattenedData, stickyIndices } = useMemo(() => {
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
    return <Spinner size="small" />
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
    <View w="100%" pos="absolute" h="120%" $gtLg={{ h: '105%' }}>
      <MyList
        data={flattenedData}
        stickyIndices={stickyIndices}
        onActivityPress={onActivityPress}
        isLoadingActivities={isLoadingActivities}
        isFetchingNextPageActivities={isFetchingNextPageActivities}
      />
      <LazyMount when={sendChatOpen}>
        <SendChat open={sendChatOpen} onOpenChange={setSendChatOpen} />
      </LazyMount>
    </View>
  )
}

type ListItem = Activity | { type: 'header'; title: string; sectionIndex: number }

interface MyListProps {
  data: ListItem[]
  stickyIndices: number[]
  onActivityPress: (activity: Activity) => void
  isLoadingActivities: boolean
  isFetchingNextPageActivities: boolean
}

const MyList = memo(
  ({
    data,
    stickyIndices,
    onActivityPress,
    isLoadingActivities,
    isFetchingNextPageActivities,
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

    const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
      if ('type' in item && item.type === 'header') {
        return <RowLabel first={item.sectionIndex === 0}>{item.title}</RowLabel>
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
          px="$2"
          $gtLg={{
            px: '$3.5',
          }}
          {...(isFirst && {
            pt: '$2',
            $gtLg: {
              pt: '$3.5',
              px: '$3.5',
            },
            borderTopLeftRadius: '$4',
            borderTopRightRadius: '$4',
          })}
          {...(isLast && {
            pb: '$2',
            $gtLg: {
              pb: '$3.5',
              px: '$3.5',
            },
            borderBottomLeftRadius: '$4',
            borderBottomRightRadius: '$4',
          })}
        >
          <TokenActivityRow activity={item as Activity} onPress={onActivityPress} />
        </YStack>
      )
    }

    return (
      <LegendList
        style={{ flex: 1 }}
        data={data}
        testID={'RecentActivity'}
        showsVerticalScrollIndicator={false}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        renderItem={renderItem}
        stickyIndices={stickyIndices}
        estimatedItemSize={65}
        contentContainerStyle={{
          paddingBottom: 150,
        }}
        ListFooterComponent={
          !isLoadingActivities && isFetchingNextPageActivities ? <Spinner size="small" /> : null
        }
        recycleItems
      />
    )
  }
)

MyList.displayName = 'MyList'

function RowLabel({ children, first }: PropsWithChildren & { first?: boolean }) {
  return (
    <View w="100%">
      <H4
        size="$7"
        fontWeight="400"
        pt={first ? 0 : '$3.5'}
        pb="$3.5"
        bc="$background"
        col="$gray11"
      >
        {children}
      </H4>
    </View>
  )
}
