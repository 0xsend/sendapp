import { memo, useCallback, useMemo } from 'react'
import { FlatList, type ListRenderItem } from 'react-native'
import { Paragraph, Shimmer, Spinner, YStack, type YStackProps } from '@my/ui'
import { useContactBook } from '../ContactBookProvider'
import type { ContactView } from '../types'
import { ContactListItem } from './ContactListItem'
import { SearchX } from '@tamagui/lucide-icons'

/**
 * Props for ContactList component.
 */
export interface ContactListProps extends Omit<YStackProps, 'children'> {
  /** Handler when a contact is pressed */
  onContactPress?: (contact: ContactView) => void
}

/** Height of each contact list item in pixels */
const CONTACT_ITEM_HEIGHT = 72

/** Subtle shadow props matching Account screen cards */
const shadowProps = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevationAndroid: 7,
} as const

/**
 * ContactList displays contacts using FlatList for optimized native scrolling.
 *
 * Features:
 * - Infinite scroll with automatic loading
 * - Loading skeleton state
 * - Empty state when no contacts
 * - Error state
 * - Optimized for native with FlatList
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
  const {
    bc = '$color1',
    br = '$4',
    f = 1,
    p = '$2',
    ...restCardProps
  } = cardProps

  const outerCardProps = {
    ...restCardProps,
    f,
    bc,
    br,
    ...shadowProps,
  } as const

  const innerCardProps = {
    f: 1,
    bc,
    br,
    p,
    overflow: 'hidden',
  } as const

  const { contacts, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage, query } =
    useContactBook()

  // Render each contact item
  const renderItem: ListRenderItem<ContactView> = useCallback(
    ({ item, index }) => {
      const isFirst = index === 0
      const isLast = index === contacts.length - 1

      return (
        <ContactListItem
          contact={item}
          onPress={onContactPress}
          isFirst={isFirst}
          isLast={isLast}
        />
      )
    },
    [contacts.length, onContactPress]
  )

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: ContactView) => `contact-${item.contact_id}`, [])

  // Handle reaching end of list
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Render loading footer
  const ListFooterComponent = useMemo(() => {
    if (isFetchingNextPage) {
      return <Spinner size="small" color="$color12" py="$3" />
    }
    return null
  }, [isFetchingNextPage])

  // Get item layout for optimization
  const getItemLayout = useCallback(
    (_data: ArrayLike<ContactView> | null | undefined, index: number) => ({
      length: CONTACT_ITEM_HEIGHT,
      offset: CONTACT_ITEM_HEIGHT * index,
      index,
    }),
    []
  )

  // Error state
  if (error) {
    return (
      <YStack {...outerCardProps}>
        <YStack {...innerCardProps}>
          <YStack f={1} ai="center" jc="center" p="$4" gap="$3">
            <Paragraph color="$red10" ta="center">
              {error.message?.split('.').at(0) ?? 'Failed to load contacts'}
            </Paragraph>
          </YStack>
        </YStack>
      </YStack>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <YStack {...outerCardProps}>
        <YStack {...innerCardProps}>
          <ContactListSkeleton />
        </YStack>
      </YStack>
    )
  }

  // Empty state
  if (contacts.length === 0) {
    return (
      <YStack {...outerCardProps}>
        <YStack {...innerCardProps}>
          <ContactListEmpty hasQuery={Boolean(query)} query={query} />
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack {...outerCardProps}>
      <YStack {...innerCardProps}>
        <FlatList
          data={contacts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          getItemLayout={getItemLayout}
          ListFooterComponent={ListFooterComponent}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </YStack>
    </YStack>
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
