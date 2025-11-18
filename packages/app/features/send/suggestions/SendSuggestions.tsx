import {
  Avatar,
  LinearGradient,
  Paragraph,
  Text,
  useEvent,
  useThemeName,
  View,
  XStack,
  YStack,
} from '@my/ui'
import { FlatList, Platform } from 'react-native'
import { useSendScreenParams } from 'app/routers/params'
import { Link } from 'solito/link'
import type {
  SendSuggestionItem,
  SendSuggestionsQueryResult,
} from 'app/features/send/suggestions/SendSuggestion.types'
import { useRecentSenders } from './useRecentSenders'
import { useFavouriteSenders } from './useFavouriteSenders'
import { useTopSenders } from './useTopSenders'
import { useTodayBirthdaySenders } from './useTodayBirthdaySenders'
import { memo, useCallback } from 'react'
import { IconBadgeCheckSolid2 } from 'app/components/icons'

export const SendSuggestions = () => {
  const recentSendersQuery = useRecentSenders()
  const favouriteSendersQuery = useFavouriteSenders()
  const topSendersQuery = useTopSenders()
  const todayBirthdaySendersQuery = useTodayBirthdaySenders()

  return (
    <>
      <SuggestionsList query={recentSendersQuery} title="Recent Activity" />
      <SuggestionsList query={favouriteSendersQuery} title="Favorite Senders" delay={100} />
      <SuggestionsList query={topSendersQuery} title="Top Senders" delay={150} />
      <SuggestionsList
        query={todayBirthdaySendersQuery}
        title="Wish Them Happy Birthday"
        delay={200}
      />
    </>
  )
}

const SuggestionsList = memo(
  ({
    query,
    title,
    delay = 0,
  }: {
    query: SendSuggestionsQueryResult
    title: string
    delay?: number
  }) => {
    const { error, data } = query

    const renderItem = useCallback(({ item }: { item: SendSuggestionItem }) => {
      return <SenderSuggestion item={item} />
    }, [])

    const keyExtractor = useCallback((item: SendSuggestionItem, index: number) => {
      return item?.send_id?.toString() ?? String(index)
    }, [])

    if (!data || data.length === 0) {
      return null
    }

    return (
      <YStack gap="$3">
        <Paragraph
          animation={[
            '200ms',
            {
              opacity: {
                delay: delay,
              },
              transform: {
                delay: delay,
              },
            },
          ]}
          enterStyle={{ opacity: 0, y: 20 }}
          size="$7"
          fontWeight={600}
          col="$color10"
        >
          {title}
        </Paragraph>
        {error ? (
          <Paragraph color={'$error'}>{error.message?.split('.')[0] ?? 'Unknown error'}</Paragraph>
        ) : (
          <>
            <View
              animation={[
                '200ms',
                {
                  opacity: {
                    delay: delay,
                  },
                  transform: {
                    delay: delay,
                  },
                },
              ]}
              enterStyle={{ opacity: 0, y: 10 }}
              exitStyle={{ opacity: 0, y: 10 }}
              mx={-24}
              pos="relative"
            >
              <FlatList
                horizontal
                bounces={true}
                data={data || []}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingRight: 24,
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                }}
                $platform-native={{
                  overflow: 'visible',
                }}
              />
              <LinearGradient
                display="none"
                $sm={{ display: 'flex' }}
                pointerEvents="none"
                colors={['rgba(255, 255, 255, 0)', '$aztec1']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                width="$4"
                height="100%"
                zi={100}
                pos="absolute"
                top={0}
                right={0}
              />
              {/* left gradient */}
              <LinearGradient
                display="none"
                $sm={{ display: 'flex' }}
                pointerEvents="none"
                colors={['$aztec1', 'rgba(255, 255, 255, 0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                width="$4"
                height="100%"
                zi={100}
                pos="absolute"
                top={0}
                left={0}
              />
            </View>
          </>
        )}
      </YStack>
    )
  }
)

SuggestionsList.displayName = 'SuggestionsList'

const SenderSuggestion = ({ item }: { item: SendSuggestionItem }) => {
  const [sendParams, setSendParams] = useSendScreenParams()
  const _sendParams = JSON.parse(JSON.stringify(sendParams)) //JSON makes sure we don't pass undefined values

  // Prefer main_tag_name, fallback to first tag in tags array
  const tagToUse = item?.main_tag_name || item?.tags?.[0]

  const label = tagToUse
    ? `/${tagToUse}`
    : item?.name
      ? item.name
      : item?.send_id
        ? `#${item.send_id}`
        : '??'

  //@ts-expect-error - is_verified is not typed
  const isVerified = item?.is_verified ?? false
  const avatarUrl = item?.avatar_url ?? ''

  const theme = useThemeName()

  const isDark = theme.includes('dark')

  const onSelect = () => {
    setSendParams({
      ...sendParams,
      ...(tagToUse
        ? {
            ..._sendParams,
            idType: 'tag',
            recipient: tagToUse,
          }
        : {
            ..._sendParams,
            idType: 'sendid',
            recipient: item?.send_id,
          }),
    })
  }

  return (
    <YStack
      gap={'$2'}
      mr={'$2'}
      $gtLg={{ mr: '$3.5' }}
      elevation={Platform.OS === 'web' ? undefined : '$0.75'}
      cur="pointer"
    >
      <View
        hoverStyle={{
          opacity: 0.8,
        }}
        animation="100ms"
        pressStyle={{
          scale: 0.95,
        }}
        onPress={onSelect}
      >
        <Avatar circular size="$7" elevation={'$0.75'}>
          {Platform.OS === 'android' && !avatarUrl ? (
            <Avatar.Image
              src={`https://ui-avatars.com/api/?name=${label}&size=256&format=png&background=86ad7f`}
            />
          ) : (
            <>
              <Avatar.Image src={avatarUrl} />
              <Avatar.Fallback jc="center" bc="$olive">
                <Avatar size="$7" br="$4">
                  <Avatar.Image
                    src={`https://ui-avatars.com/api/?name=${label}&size=256&format=png&background=86ad7f`}
                  />
                </Avatar>
              </Avatar.Fallback>
            </>
          )}
        </Avatar>

        {isVerified && (
          <XStack zi={100} pos="absolute" bottom={0} right={0} x="$-1" y="$-1">
            <XStack
              pos="absolute"
              x="$-0.5"
              y="$-0.5"
              elevation={'$1'}
              scale={0.7}
              br={1000}
              inset={0}
            />
            <IconBadgeCheckSolid2
              size="$1"
              scale={0.95}
              color="$neon8"
              $theme-dark={{ color: '$neon7' }}
              //@ts-expect-error - checkColor is not typed
              checkColor={isDark ? '#082B1B' : '#fff'}
            />
          </XStack>
        )}
      </View>
      <Text
        w={74}
        fontSize={'$3'}
        numberOfLines={1}
        ellipsizeMode="tail"
        color="$color12"
        disableClassName
        ta={'center'}
      >
        {label}
      </Text>
    </YStack>
  )
}
