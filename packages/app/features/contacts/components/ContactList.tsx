import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Card,
  type CardProps,
  Paragraph,
  Shimmer,
  Spinner,
  useMedia,
  YStack,
  dataProviderMakerWeb,
  layoutProviderMakerWeb,
} from '@my/ui'
import { RecyclerListView, type Dimension } from 'recyclerlistview/web'
import { useContactBook } from '../ContactBookProvider'
import type { ContactView } from '../types'
import { ContactListItem } from './ContactListItem'
import { SearchX } from '@tamagui/lucide-icons'

/** Minimum time to show skeleton before transitioning to content (prevents flashing) */
const SKELETON_MIN_DISPLAY_MS = 150

/**
 * Props for ContactList component.
 */
export interface ContactListProps extends Omit<CardProps, 'children'> {
  /** Handler when a contact is pressed */
  onContactPress?: (contact: ContactView) => void
}

/** Height of each contact list item in pixels */
const CONTACT_ITEM_HEIGHT = 72

/**
 * ContactList displays contacts using RecyclerList for virtualized scrolling.
 *
 * Features:
 * - Infinite scroll with automatic loading
 * - Loading skeleton state
 * - Empty state when no contacts
 * - Error state
 * - Optimized for web with RecyclerListView
 *
 * @example
 * ```tsx
 * <ContactList
 *   onContactPress={(contact) => navigateToContact(contact.contact_id)}
 * />
 * ```
 */
export const ContactList = memo(function ContactList({
  onContactPress,
  ...cardProps
}: ContactListProps) {
  const media = useMedia()
  const [layoutSize, setLayoutSize] = useState<Dimension>({ width: 0, height: 0 })

  const { contacts, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage, query } =
    useContactBook()

  // Skeleton display state with minimum display time to prevent flashing
  // Track when skeleton becomes visible (not when loading starts) for accurate timing
  const [showSkeleton, setShowSkeleton] = useState(isLoading)
  const skeletonVisibleSinceRef = useRef<number | null>(null)

  useEffect(() => {
    if (isLoading && !showSkeleton) {
      // Loading started - show skeleton after a tiny delay (prevents flash for instant loads)
      const timer = setTimeout(() => {
        skeletonVisibleSinceRef.current = Date.now()
        setShowSkeleton(true)
      }, 50)
      return () => clearTimeout(timer)
    }

    if (!isLoading && showSkeleton) {
      // Loading finished - ensure minimum display time from when skeleton became visible
      const visibleSince = skeletonVisibleSinceRef.current ?? Date.now()
      const elapsed = Date.now() - visibleSince
      const remaining = Math.max(0, SKELETON_MIN_DISPLAY_MS - elapsed)
      const timer = setTimeout(() => {
        setShowSkeleton(false)
        skeletonVisibleSinceRef.current = null
      }, remaining)
      return () => clearTimeout(timer)
    }
  }, [isLoading, showSkeleton])

  const layoutSizeAdjustment = media.gtLg ? 32 : 14

  // Data provider for RecyclerListView
  const [dataProvider, setDataProvider] = useState(dataProviderMakerWeb(contacts))

  const layoutProvider = layoutProviderMakerWeb({
    getHeightOrWidth: () => CONTACT_ITEM_HEIGHT,
  })

  // Update data provider when contacts change
  useEffect(() => {
    setDataProvider((prev) => prev.cloneWithRows(contacts))
  }, [contacts])

  // Render each contact row
  const renderRow = useCallback(
    (_type: string | number, contact: ContactView, index: number) => {
      const isFirst = index === 0
      const isLast = index === contacts.length - 1

      return (
        <ContactListItem
          contact={contact}
          onPress={onContactPress}
          isFirst={isFirst}
          isLast={isLast}
        />
      )
    },
    [contacts.length, onContactPress]
  )

  // Render loading footer
  const renderFooter = useCallback(() => {
    if (!isLoading && isFetchingNextPage) {
      return <Spinner size="small" color="$color12" mb="$3.5" />
    }
    return <Spinner opacity={0} mb="$3.5" />
  }, [isLoading, isFetchingNextPage])

  // Handle container layout
  const onCardLayout = useCallback((e: { nativeEvent: { layout: Dimension } }) => {
    setLayoutSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
  }, [])

  // Handle reaching end of list
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Error state
  if (error) {
    return (
      <Card {...cardProps} f={1}>
        <YStack f={1} ai="center" jc="center" p="$4" gap="$3">
          <Paragraph color="$red10" ta="center">
            {error.message?.split('.').at(0) ?? 'Failed to load contacts'}
          </Paragraph>
        </YStack>
      </Card>
    )
  }

  // Loading state - use showSkeleton to prevent flashing
  if (showSkeleton) {
    return (
      <Card {...cardProps} f={1}>
        <ContactListSkeleton />
      </Card>
    )
  }

  // Empty state - suppress while loading to avoid flash during skeleton delay
  if (contacts.length === 0 && !isLoading) {
    return (
      <Card {...cardProps} f={1}>
        <ContactListEmpty hasQuery={Boolean(query)} query={query} />
      </Card>
    )
  }

  return (
    <Card {...cardProps} f={1} onLayout={onCardLayout}>
      {dataProvider.getSize() > 0 && layoutSize.height > 0 ? (
        <RecyclerListView
          style={{ flex: 1, overflow: 'auto' }}
          dataProvider={dataProvider}
          rowRenderer={renderRow}
          layoutProvider={layoutProvider}
          renderFooter={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={500}
          layoutSize={{
            width: layoutSize.width - layoutSizeAdjustment,
            height: layoutSize.height,
          }}
          key={`contact-recycler-${layoutSize.width}-${layoutSize.height}`}
        />
      ) : null}
    </Card>
  )
})

/** Static skeleton item IDs to avoid array index as key lint warning. */
const SKELETON_IDS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'] as const

/**
 * Loading skeleton for the contact list.
 */
const ContactListSkeleton = memo(function ContactListSkeleton() {
  return (
    <YStack p="$3" gap="$3">
      {SKELETON_IDS.map((id) => (
        <YStack key={id} fd="row" ai="center" gap="$3" h={CONTACT_ITEM_HEIGHT} px="$3.5" py="$2.5">
          <Shimmer w={48} h={48} br={1000} />
          <YStack f={1} gap="$2">
            <Shimmer w="60%" h={20} br="$2" />
            <Shimmer w="40%" h={14} br="$2" />
          </YStack>
        </YStack>
      ))}
    </YStack>
  )
})

/**
 * Props for ContactListEmpty component.
 */
interface ContactListEmptyProps {
  hasQuery: boolean
  query: string
}

/**
 * Empty state for the contact list.
 */
const ContactListEmpty = memo(function ContactListEmpty({
  hasQuery,
  query,
}: ContactListEmptyProps) {
  if (hasQuery) {
    return (
      <YStack f={1} ai="center" jc="center" p="$6" gap="$3">
        <SearchX size="$2" color="$color10" />
        <Paragraph color="$color10" ta="center" size="$5">
          No contacts found for "{query}"
        </Paragraph>
        <Paragraph color="$color11" ta="center" size="$3">
          Try a different search term
        </Paragraph>
      </YStack>
    )
  }

  return (
    <YStack f={1} ai="center" jc="center" p="$6" gap="$3">
      <Paragraph color="$color10" ta="center" size="$5">
        No contacts yet
      </Paragraph>
      <Paragraph color="$color11" ta="center" size="$3">
        Start adding contacts by sending to someone or adding them manually
      </Paragraph>
    </YStack>
  )
})

export default ContactList
