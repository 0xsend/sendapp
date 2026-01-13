import {
  Button,
  LinearGradient,
  Paragraph,
  Shimmer,
  Text,
  useTheme,
  useThemeName,
  View,
  XStack,
  YStack,
  FastImage,
  isWeb,
} from '@my/ui'
import { FlatList, Platform } from 'react-native'
import { useSendScreenParams } from 'app/routers/params'
import type {
  SendSuggestionItem,
  SendSuggestionsQueryResult,
} from 'app/features/send/suggestions/SendSuggestion.types'
import { useRecentSenders } from './useRecentSenders'
import { useFavouriteSenders } from './useFavouriteSenders'
import { useTopSenders } from './useTopSenders'
import { useTodayBirthdaySenders } from './useTodayBirthdaySenders'
import React, { memo, useCallback, useId, useMemo } from 'react'
import { IconBadgeCheckSolid2 } from 'app/components/icons'
import { useTranslation } from 'react-i18next'

export const SendSuggestions = () => {
  const recentSendersQuery = useRecentSenders()
  const favouriteSendersQuery = useFavouriteSenders()
  const topSendersQuery = useTopSenders()
  const todayBirthdaySendersQuery = useTodayBirthdaySenders()
  const { t } = useTranslation('send')

  return (
    <>
      <SuggestionsList query={recentSendersQuery} title={t('suggestions.recent')} />
      <SuggestionsList
        query={favouriteSendersQuery}
        title={t('suggestions.favorites')}
        delay={100}
      />
      <SuggestionsList query={topSendersQuery} title={t('suggestions.top')} delay={150} />
      <SuggestionsList
        query={todayBirthdaySendersQuery}
        title={t('suggestions.birthdays')}
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
    const { error, data, hasNextPage, fetchNextPage, isFetchingNextPage } = query
    const { t } = useTranslation('send')
    const skeletonBaseId = useId()
    const skeletonKeys = Array.from({ length: 10 }, (_, i) => `${skeletonBaseId}-${i}`)
    const theme = useTheme()

    const pages = data?.pages || []

    const renderItem = useCallback(({ item }: { item: SendSuggestionItem }) => {
      return <SenderSuggestion item={item} />
    }, [])

    const keyExtractor = useCallback((item: SendSuggestionItem, index: number) => {
      return item?.send_id?.toString() ?? String(index)
    }, [])

    // Check if there's any data in any page
    const hasAnyData = pages.some((page) => page && page.length > 0)

    if (!hasAnyData) {
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
          <Paragraph color={'$error'}>
            {error.message?.split('.')[0] ?? t('search.unknownError')}
          </Paragraph>
        ) : (
          <>
            {pages.map((pageItems, pageIndex) => (
              <View
                key={`page-${pageIndex}-${pageItems[0]?.send_id ?? pageIndex}`}
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
                  data={pageItems}
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
                  colors={[`${theme.background.val}00`, '$aztec1']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  width="$4"
                  height="100%"
                  zi={100}
                  pos="absolute"
                  top={0}
                  right={0}
                />
              </View>
            ))}
            {hasNextPage && isFetchingNextPage ? (
              <XStack gap="$2">
                {skeletonKeys.map((key) => (
                  <Shimmer key={key} ov="hidden" br="$12" w="$7" h="$7" bg="$color1" />
                ))}
              </XStack>
            ) : hasNextPage ? (
              <XStack mt="$2">
                <Button
                  size="$3"
                  onPress={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  chromeless
                >
                  <Button.Text textDecorationLine="underline" color="$color10">
                    {t('suggestions.viewMore')}
                  </Button.Text>
                </Button>
              </XStack>
            ) : null}
          </>
        )}
      </YStack>
    )
  }
)

SuggestionsList.displayName = 'SuggestionsList'

const SenderSuggestion = ({ item }: { item: SendSuggestionItem }) => {
  const [sendParams, setSendParams] = useSendScreenParams()

  // Prefer main_tag_name, fallback to first tag in tags array
  const tagToUse = item?.main_tag_name || item?.tags?.[0]

  const label = tagToUse
    ? `/${tagToUse}`
    : item?.name
      ? item.name
      : item?.send_id
        ? `#${item.send_id}`
        : '??'

  const isVerified = item?.is_verified ?? false
  const avatarUrl = item?.avatar_url ?? ''

  const theme = useThemeName()

  const isDark = theme.includes('dark')

  const onSelect = () => {
    const _sendParams = JSON.parse(JSON.stringify(sendParams))
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
        <Image avatarUrl={avatarUrl} label={label} />

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

interface ImageProps {
  avatarUrl: string
  label: string
}

const Image = React.memo(({ avatarUrl, label }: ImageProps) => {
  const themeObj = useTheme()
  const fastImageStyle = useMemo(
    () => ({
      backgroundColor: themeObj.background.val,
      borderRadius: 1000_000,
    }),
    [themeObj.background.val]
  )

  return (
    <XStack ov="hidden" br={1000_000} elevation="$0.75">
      {!avatarUrl ? (
        <FastImage
          src={`https://ui-avatars.com/api/?name=${label}&size=256&format=png&background=86ad7f`}
          width={74}
          height={74}
          style={fastImageStyle}
        />
      ) : (
        <FastImage
          alt={`${label} avatar`}
          width={74}
          height={74}
          src={avatarUrl}
          style={fastImageStyle}
          onError={(e) => {
            if (isWeb) {
              e.target.src = `https://ui-avatars.com/api/?name=${label}&size=256&format=png&background=86ad7f`
            }
          }}
        />
      )}
    </XStack>
  )
})

Image.displayName = 'Image'
