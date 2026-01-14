import {
  AnimatePresence,
  Button,
  LinearGradient,
  Paragraph,
  Shimmer,
  SizableText,
  Text,
  useTheme,
  useThemeName,
  View,
  XStack,
  YStack,
  FastImage,
  isWeb,
  styled,
  ThemeableStack,
} from '@my/ui'
import { isAndroid, type StackProps } from '@tamagui/core'
import type { TabLayout, TabsTabProps } from '@tamagui/tabs'
import { createTabs } from '@tamagui/tabs'
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
import React, { memo, useCallback, useId, useMemo, useState } from 'react'
import { IconBadgeCheckSolid2 } from 'app/components/icons'
import { useTranslation } from 'react-i18next'
import { AnimatedLetterText } from '@my/ui'
import { UserSearch } from '@tamagui/lucide-icons'

const TabsFrame = styled(YStack, {
  name: 'TabsFrame',
})

const TabFrame = styled(ThemeableStack, {
  name: 'TabsTrigger',
  tag: 'button',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: 'transparent',
      },
    },
  } as const,
})

const ContentFrame = styled(ThemeableStack, {
  name: 'TabsContent',
  flex: 1,
})

const CustomTabs = createTabs({
  TabsFrame,
  TabFrame,
  ContentFrame,
})

const TabsRovingIndicator = ({ active, ...props }: { active?: boolean } & StackProps) => {
  const theme = useThemeName()
  return (
    <YStack
      position="absolute"
      backgroundColor={theme === 'light' ? '$gray1' : '$color1'}
      opacity={0.7}
      animation="100ms"
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      {...(active && {
        backgroundColor: theme === 'light' ? '$gray6' : '$aztec5',
        opacity: 1,
      })}
      {...props}
    />
  )
}

export const SendSuggestions = () => {
  const recentSendersQuery = useRecentSenders()
  const favouriteSendersQuery = useFavouriteSenders()
  const topSendersQuery = useTopSenders()
  const todayBirthdaySendersQuery = useTodayBirthdaySenders()
  const { t } = useTranslation('send')

  const [tabState, setTabState] = useState<{
    currentTab: string
    intentAt: TabLayout | null
    activeAt: TabLayout | null
    prevActiveAt: TabLayout | null
  }>({
    currentTab: 'recent',
    intentAt: null,
    activeAt: null,
    prevActiveAt: null,
  })

  const setCurrentTab = (currentTab: string) => setTabState({ ...tabState, currentTab })
  const setIntentIndicator = (intentAt: TabLayout | null) => setTabState({ ...tabState, intentAt })
  const setActiveIndicator = (activeAt: TabLayout | null) =>
    setTabState({ ...tabState, prevActiveAt: tabState.activeAt, activeAt })

  const { activeAt, intentAt, currentTab } = tabState

  const handleOnInteraction: TabsTabProps['onInteraction'] = (type, layout) => {
    if (type === 'select') {
      setActiveIndicator(layout)
    } else {
      setIntentIndicator(layout)
    }
  }

  const activeTitle =
    currentTab === 'recent'
      ? t('suggestions.recent')
      : currentTab === 'favorites'
        ? t('suggestions.favorites')
        : currentTab === 'top'
          ? t('suggestions.top')
          : currentTab === 'birthdays'
            ? t('suggestions.birthdays')
            : ''

  // TODO: enable animated letter text for android once upgrade to react-native-reanimated 3.19.4 or higher
  const TitleText = isAndroid ? Text : AnimatedLetterText

  return (
    <CustomTabs
      value={currentTab}
      onValueChange={setCurrentTab}
      orientation="horizontal"
      flexDirection="column"
      activationMode="manual"
      gap="$4"
      $gtSm={{
        gap: '$6',
      }}
    >
      <YStack position="relative">
        {/* Hover/focus indicator */}
        {isWeb && (
          <AnimatePresence>
            {intentAt && (
              <TabsRovingIndicator
                borderRadius={1000}
                width={intentAt.width}
                height={intentAt.height}
                x={intentAt.x}
                y={intentAt.y}
              />
            )}
          </AnimatePresence>
        )}

        {/* Active tab indicator */}
        <AnimatePresence>
          {activeAt && (
            <TabsRovingIndicator
              borderRadius={1000}
              active
              width={activeAt.width}
              height={activeAt.height}
              x={activeAt.x}
              y={activeAt.y}
            />
          )}
        </AnimatePresence>

        <CustomTabs.List disablePassBorderRadius loop={false} backgroundColor="transparent">
          <EachTab
            value="recent"
            title={t('suggestions.recent')}
            onInteraction={handleOnInteraction}
            currentTab={currentTab}
          />
          <EachTab
            value="favorites"
            title={t('suggestions.favorites')}
            onInteraction={handleOnInteraction}
            currentTab={currentTab}
          />
          <EachTab
            value="top"
            title={t('suggestions.top')}
            onInteraction={handleOnInteraction}
            currentTab={currentTab}
          />
          <EachTab
            value="birthdays"
            title={t('suggestions.birthdays')}
            onInteraction={handleOnInteraction}
            currentTab={currentTab}
          />
        </CustomTabs.List>
      </YStack>

      <View gap="$3" pl="$3.5">
        <TitleText fontSize="$8" fontWeight="600" color="$color12" h={30}>
          {activeTitle}
        </TitleText>
        <XStack mih={120}>
          <CustomTabs.Content value="recent">
            <SuggestionsContent query={recentSendersQuery} />
          </CustomTabs.Content>
          <CustomTabs.Content value="favorites">
            <SuggestionsContent query={favouriteSendersQuery} />
          </CustomTabs.Content>
          <CustomTabs.Content value="top">
            <SuggestionsContent query={topSendersQuery} />
          </CustomTabs.Content>
          <CustomTabs.Content value="birthdays">
            <SuggestionsContent query={todayBirthdaySendersQuery} />
          </CustomTabs.Content>
        </XStack>
      </View>
    </CustomTabs>
  )
}

interface EachTabProps {
  value: string
  title: string
  onInteraction: TabsTabProps['onInteraction']
  currentTab: string
}

const EachTab = ({ value, title, onInteraction, currentTab }: EachTabProps) => {
  return (
    <CustomTabs.Tab
      unstyled
      cur="pointer"
      paddingVertical="$2"
      paddingHorizontal="$4"
      value={value}
      onInteraction={onInteraction}
      active={currentTab === value}
    >
      <SizableText
        size="$5"
        $sm={{
          size: '$4',
        }}
        color={currentTab === value ? '$color11' : '$color10'}
      >
        {title}
      </SizableText>
    </CustomTabs.Tab>
  )
}

const SuggestionsContent = memo(({ query }: { query: SendSuggestionsQueryResult }) => {
  const { error, data, hasNextPage, fetchNextPage, isFetchingNextPage } = query
  const { t } = useTranslation('send')
  const skeletonBaseId = useId()
  const skeletonKeys = Array.from({ length: 10 }, (_, i) => `${skeletonBaseId}-${i}`)

  const pages = data?.pages || []

  const renderItem = useCallback(({ item }: { item: SendSuggestionItem }) => {
    return <SenderSuggestion item={item} />
  }, [])

  const keyExtractor = useCallback((item: SendSuggestionItem, index: number) => {
    return item?.send_id?.toString() ?? String(index)
  }, [])

  const hasAnyData = pages.some((page) => page && page.length > 0)

  if (!hasAnyData) {
    return (
      <View gap="$2">
        <UserSearch color="$gray9" size="$3" strokeWidth={1.4} />
        <Paragraph color="$color10">{t('suggestions.noResults')}</Paragraph>
      </View>
    )
  }

  return (
    <YStack gap="$4" flex={1}>
      {error ? (
        <Paragraph color={'$error'}>
          {error.message?.split('.')[0] ?? t('search.unknownError')}
        </Paragraph>
      ) : (
        <>
          {pages.map((pageItems, pageIndex) => (
            <View
              key={`page-${pageIndex}-${pageItems[0]?.send_id ?? pageIndex}`}
              animation="200ms"
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
            </View>
          ))}
          {hasNextPage && isFetchingNextPage ? (
            <XStack gap="$2" px="$1">
              {skeletonKeys.map((key) => (
                <Shimmer key={key} ov="hidden" br="$12" w="$7" h="$7" bg="$color1" />
              ))}
            </XStack>
          ) : hasNextPage ? (
            <XStack mt="$2" px="$1">
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
})

SuggestionsContent.displayName = 'SuggestionsContent'

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
          onError={(e: { target: { src: string } }) => {
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
