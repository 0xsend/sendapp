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
  Activity,
} from '@my/ui'
import { isAndroid, useEvent, useMedia, type StackProps } from '@tamagui/core'
import type { TabLayout, TabsTabProps } from '@tamagui/tabs'
import { createTabs } from '@tamagui/tabs'
import { FlatList, Platform } from 'react-native'
import { useSendScreenParams } from 'app/routers/params'
import type {
  SendSuggestionItem,
  SendSuggestionsQueryResult,
} from 'app/features/send/suggestions/SendSuggestion.types'
import { ContactsRow, useSendPageContacts } from 'app/features/contacts/send-integration'
import { useRecentSenders } from './useRecentSenders'
import { useFavouriteSenders } from './useFavouriteSenders'
import { useTopSenders } from './useTopSenders'
import { useTodayBirthdaySenders } from './useTodayBirthdaySenders'
import React, { memo, useCallback, useDeferredValue, useId, useMemo, useState } from 'react'

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
  const { gtSm } = useMedia()
  return (
    <YStack
      position="absolute"
      {...(gtSm && {
        animation: '100ms',
        animateOnly: ['opacity', 'transform', 'width', 'height'],
      })}
      elevation={isWeb ? '$1' : 0}
      shadowOpacity={0.3}
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      {...(active && {
        backgroundColor: theme === 'light' ? '$gray7' : '$aztec5',
        opacity: 1,
      })}
      {...props}
      y={isWeb ? 0 : props.y}
    />
  )
}

export const SendSuggestions = () => {
  const recentSendersQuery = useRecentSenders()
  const favouriteSendersQuery = useFavouriteSenders()
  const topSendersQuery = useTopSenders()
  const todayBirthdaySendersQuery = useTodayBirthdaySenders()
  const contactsQuery = useSendPageContacts()

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
  const setActiveIndicator = (activeAt: TabLayout | null) =>
    setTabState({ ...tabState, prevActiveAt: tabState.activeAt, activeAt })

  const { activeAt, currentTab } = tabState

  const currentTabDeferred = useDeferredValue(currentTab)

  const handleOnInteraction: TabsTabProps['onInteraction'] = useEvent((type, layout) => {
    if (type === 'select') {
      setActiveIndicator(layout)
    }
  })

  const activeTitle =
    currentTab === 'recent'
      ? t('suggestions.recent')
      : currentTab === 'favorites'
        ? t('suggestions.favorites')
        : currentTab === 'top'
          ? t('suggestions.top')
          : currentTab === 'birthdays'
            ? t('suggestions.birthdays')
            : currentTab === 'contacts'
              ? t('suggestions.contacts')
              : ''

  // TODO: enable animated letter text for android once upgrade to react-native-reanimated 3.19.4 or higher
  const TitleText = isAndroid ? Text : AnimatedLetterText

  const themeName = useThemeName()

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
      <YStack
        $xs={{
          mx: -5,
        }}
        position="relative"
      >
        <CustomTabs.List
          als="flex-start"
          br={100}
          disablePassBorderRadius
          loop={false}
          backgroundColor={themeName === 'light' ? '$gray1' : '$aztec2'}
          ov="hidden"
          w="100%"
          maw={460}
          p="$1.5"
          pr="$2"
          pl="$1"
          $platform-android={{
            px: '$1.5',
          }}
        >
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
          <EachTab
            value="recent"
            title={t('suggestions.recent')}
            onInteraction={handleOnInteraction}
            currentTab={currentTab}
          />
          <EachTab
            value="contacts"
            title={t('suggestions.contacts')}
            onInteraction={handleOnInteraction}
            currentTab={currentTab}
          />
          <EachTab
            value="top"
            f={1.5}
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

      <View gap="$3" pl="$1.5">
        <TitleText x="$1" fontSize="$8" fontWeight="600" color="$color12" h={30}>
          {activeTitle}
        </TitleText>
        <XStack mih={120}>
          <Activity mode={currentTabDeferred === 'recent' ? 'visible' : 'hidden'}>
            <SuggestionsContent query={recentSendersQuery} />
          </Activity>
          <Activity mode={currentTabDeferred === 'top' ? 'visible' : 'hidden'}>
            <SuggestionsContent query={topSendersQuery} />
          </Activity>
          <Activity mode={currentTabDeferred === 'birthdays' ? 'visible' : 'hidden'}>
            <SuggestionsContent query={todayBirthdaySendersQuery} />
          </Activity>
          <Activity mode={currentTabDeferred === 'contacts' ? 'visible' : 'hidden'}>
            <ContactsTabContent query={contactsQuery} />
          </Activity>
        </XStack>
      </View>
    </CustomTabs>
  )
}

interface EachTabProps extends StackProps {
  value: string
  title: string
  onInteraction: TabsTabProps['onInteraction']
  currentTab: string
}

const EachTab = ({ value, title, onInteraction, currentTab, ...props }: EachTabProps) => {
  return (
    <CustomTabs.Tab
      unstyled
      cur="pointer"
      paddingVertical="$2"
      value={value}
      onInteraction={onInteraction}
      active={currentTab === value}
      f={2}
      jc="center"
      ai="center"
      {...props}
    >
      <SizableText
        size="$5"
        $sm={{
          size: '$3',
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

  const deferredPages = useDeferredValue(pages)

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
        <View>
          {deferredPages.map((pageItems, pageIndex) => (
            <PageRow
              key={`page-${pageItems[0]?.send_id ?? pageIndex}`}
              pageItems={pageItems}
              pageIndex={pageIndex}
            />
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
        </View>
      )}
    </YStack>
  )
})

SuggestionsContent.displayName = 'SuggestionsContent'

/**
 * Content component for the Contacts tab.
 * Renders contacts in multiple horizontal rows like other tabs.
 * Reuses ContactsRow from contacts feature.
 */
const ContactsTabContent = memo(({ query }: { query: ReturnType<typeof useSendPageContacts> }) => {
  const { error, data, hasNextPage, fetchNextPage, isFetchingNextPage } = query
  const { t } = useTranslation('send')
  const skeletonBaseId = useId()
  const skeletonKeys = Array.from({ length: 10 }, (_, i) => `${skeletonBaseId}-contact-${i}`)

  const pages = data?.pages || []
  const deferredPages = useDeferredValue(pages)
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
        <View>
          {deferredPages.map((pageItems, pageIndex) => (
            <ContactsRow
              key={`contact-page-${pageItems[0]?.contact_id ?? pageIndex}`}
              contacts={pageItems}
            />
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
        </View>
      )}
    </YStack>
  )
})

ContactsTabContent.displayName = 'ContactsTabContent'

const PageRow = memo(
  function PageRow({
    pageItems,
    pageIndex,
  }: {
    pageItems: SendSuggestionItem[]
    pageIndex: number
  }) {
    const theme = useTheme()
    const renderItem = useCallback(({ item }: { item: SendSuggestionItem }) => {
      return <SenderSuggestion item={item} />
    }, [])

    const keyExtractor = useCallback((item: SendSuggestionItem, index: number) => {
      return item?.send_id?.toString() ?? String(index)
    }, [])

    return (
      <View mx={-24} pos="relative">
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
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={3}
          removeClippedSubviews={!isWeb}
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
    )
  },
  (prevProps, nextProps) =>
    prevProps.pageIndex === nextProps.pageIndex && prevProps.pageItems === nextProps.pageItems
)

const SenderSuggestion = memo(
  function SenderSuggestion({ item }: { item: SendSuggestionItem }) {
    const [, setSendParams] = useSendScreenParams()

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

    const onSelect = useCallback(() => {
      setSendParams(
        tagToUse
          ? {
              idType: 'tag',
              recipient: tagToUse,
            }
          : {
              idType: 'sendid',
              recipient: String(item?.send_id),
            }
      )
    }, [setSendParams, tagToUse, item?.send_id])

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
  },
  (prevProps, nextProps) => prevProps.item?.send_id === nextProps.item?.send_id
)

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
