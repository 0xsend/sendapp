import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { Activity } from 'app/utils/zod/activity'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { ZodError } from 'zod'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { memo, type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { H4, LazyMount, Paragraph, Spinner, View, YStack } from '@my/ui'
import { SectionList } from 'react-native'
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

  const sections = useMemo(() => {
    if (!data?.pages) return []

    const activities = data.pages.flat()
    const locale = i18n.resolvedLanguage ?? i18n.language
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

    return Object.entries(groups).map(([title, data], index) => ({
      title,
      data,
      index,
    }))
  }, [data?.pages, t, i18n.language, i18n.resolvedLanguage])

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

  if (!sections.length) {
    return <RowLabel>{t('empty.noActivities')}</RowLabel>
  }

  return (
    <View w="100%" pos="absolute" h="120%" $gtLg={{ h: '105%' }}>
      <MyList
        sections={sections}
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

interface MyListProps {
  sections: {
    title: string
    data: Activity[]
    index: number
  }[]
  onActivityPress: (activity: Activity) => void
  isLoadingActivities: boolean
  isFetchingNextPageActivities: boolean
}

const MyList = memo(
  ({
    sections,
    onActivityPress,
    isLoadingActivities,
    isFetchingNextPageActivities,
  }: MyListProps) => {
    return (
      <SectionList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 150,
        }}
        sections={sections}
        testID={'RecentActivity'}
        showsVerticalScrollIndicator={false}
        keyExtractor={(activity) =>
          `${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`
        }
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
                px: '$3.5',
              },
              borderTopLeftRadius: '$4',
              borderTopRightRadius: '$4',
            })}
            {...(index === section.data.length - 1 && {
              pb: '$2',
              $gtLg: {
                pb: '$3.5',
                px: '$3.5',
              },
              borderBottomLeftRadius: '$4',
              borderBottomRightRadius: '$4',
            })}
          >
            <TokenActivityRow activity={activity} onPress={onActivityPress} />
          </YStack>
        )}
        renderSectionHeader={({ section: { title, index } }) => (
          <RowLabel first={index === 0}>{title}</RowLabel>
        )}
        ListFooterComponent={
          !isLoadingActivities && isFetchingNextPageActivities ? <Spinner size="small" /> : null
        }
        stickySectionHeadersEnabled={true}
      />
    )
  }
)

MyList.displayName = 'MyList'

function RowLabel({ children, first }: PropsWithChildren & { first?: boolean }) {
  return (
    <H4 fontWeight={'600'} size={'$7'} pt={first ? 0 : '$3.5'} pb="$3.5" bc="$background">
      {children}
    </H4>
  )
}
