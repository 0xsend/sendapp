import {
  Avatar,
  Button,
  Dialog,
  H4,
  Input,
  Paragraph,
  Sheet,
  Spinner,
  Text,
  useDebounce,
  VisuallyHidden,
  XStack,
  YStack,
} from '@my/ui'
import { IconAccount, IconSearch, IconX } from 'app/components/icons'
import { memo, useCallback, useState } from 'react'
import { FlatList, Platform } from 'react-native'
import { CONTACTS_SEARCH_DEBOUNCE_MS } from '../constants'
import { useContactSearch } from '../hooks/useContactSearch'
import type { ContactView } from '../types'

/**
 * Props for ContactPickerSheet component.
 */
export interface ContactPickerSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when a contact is selected */
  onSelect: (contact: ContactView) => void
  /** Title to display at the top of the sheet */
  title?: string
}

/**
 * ContactPickerSheet provides a bottom sheet (native) / dialog (web) for
 * selecting a contact during the send flow.
 *
 * Features:
 * - Search input for filtering contacts
 * - Scrollable list of matching contacts
 * - Calls onSelect callback when a contact is tapped
 *
 * Uses Sheet on native and Dialog on web for platform-appropriate UX.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * const handleSelect = (contact: ContactView) => {
 *   // Set recipient in send flow
 *   setIsOpen(false)
 * }
 *
 * <ContactPickerSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSelect={handleSelect}
 * />
 * ```
 */
export const ContactPickerSheet = memo(function ContactPickerSheet({
  open,
  onOpenChange,
  onSelect,
  title = 'Select Contact',
}: ContactPickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounced handler to update the query used for searching
  const handleDebouncedSearch = useDebounce(
    (query: string) => {
      setDebouncedQuery(query)
    },
    CONTACTS_SEARCH_DEBOUNCE_MS,
    { leading: false }
  )

  // Update debounced query when search query changes
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text)
      handleDebouncedSearch(text)
    },
    [handleDebouncedSearch]
  )

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useContactSearch({
    query: debouncedQuery,
    enabled: open,
  })

  // Flatten pages into single array
  const contacts = data?.pages?.flat() ?? []

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
  }, [])

  const handleSelect = useCallback(
    (contact: ContactView) => {
      onSelect(contact)
      onOpenChange(false)
      clearSearch()
    },
    [onSelect, onOpenChange, clearSearch]
  )

  const handleClose = useCallback(() => {
    onOpenChange(false)
    clearSearch()
  }, [onOpenChange, clearSearch])

  const renderItem = useCallback(
    ({ item }: { item: ContactView }) => {
      return <ContactPickerItem contact={item} onPress={handleSelect} />
    },
    [handleSelect]
  )

  const keyExtractor = useCallback((item: ContactView, index: number) => {
    return item.contact_id?.toString() ?? String(index)
  }, [])

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sheetContent = (
    <YStack gap="$4" padding="$4" pb="$6" flex={1}>
      {/* Header with close button */}
      <XStack justifyContent="space-between" alignItems="center">
        <H4>{title}</H4>
        <Button
          size="$3"
          circular
          chromeless
          onPress={handleClose}
          icon={<IconX size={20} color="$color12" />}
        />
      </XStack>

      {/* Search input */}
      <XStack
        alignItems="center"
        gap="$2"
        backgroundColor="$color2"
        borderRadius="$4"
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        <IconSearch size={20} color="$color10" />
        <Input
          flex={1}
          size="$4"
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          backgroundColor="transparent"
          borderWidth={0}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Button
            size="$2"
            circular
            chromeless
            onPress={clearSearch}
            icon={<IconX size={16} color="$color10" />}
          />
        )}
      </XStack>

      {/* Contact list */}
      <YStack flex={1} minHeight={200}>
        {isLoading && contacts.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner size="large" />
          </YStack>
        ) : contacts.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$2">
            <Paragraph color="$color10">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </Paragraph>
          </YStack>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <XStack py="$3" jc="center">
                  <Spinner size="small" />
                </XStack>
              ) : null
            }
          />
        )}
      </YStack>
    </YStack>
  )

  // Web version using Dialog
  if (Platform.OS === 'web') {
    return (
      <Dialog modal open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: { overshootClamping: true },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            width="90%"
            maxWidth={500}
            height={600}
            overflow="hidden"
          >
            <VisuallyHidden>
              <Dialog.Title>Select Contact</Dialog.Title>
            </VisuallyHidden>
            {sheetContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    )
  }

  // Native version using Sheet
  return (
    <Sheet
      open={open}
      modal
      onOpenChange={onOpenChange}
      dismissOnSnapToBottom
      dismissOnOverlayPress
      native
      snapPoints={[85]}
    >
      <Sheet.Frame key="contact-picker-sheet">{sheetContent}</Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
})

/**
 * Props for ContactPickerItem.
 */
interface ContactPickerItemProps {
  contact: ContactView
  onPress: (contact: ContactView) => void
}

/**
 * Determines the display name for a contact.
 */
function getDisplayName(contact: ContactView): string {
  if (contact.custom_name) return contact.custom_name
  if (contact.profile_name) return contact.profile_name
  if (contact.main_tag_name) return `/${contact.main_tag_name}`
  if (contact.external_address) {
    const addr = contact.external_address
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  return 'Unknown Contact'
}

/**
 * Determines the subtitle for a contact.
 */
function getSubtitle(contact: ContactView): string | null {
  // If custom name is set, show the original tag/profile as subtitle
  if (contact.custom_name) {
    if (contact.main_tag_name) return `/${contact.main_tag_name}`
    if (contact.profile_name) return contact.profile_name
  }
  // Show send_id if available
  if (contact.send_id) return `#${contact.send_id}`
  return null
}

/**
 * Individual contact item in the picker list.
 */
const ContactPickerItem = memo(function ContactPickerItem({
  contact,
  onPress,
}: ContactPickerItemProps) {
  const displayName = getDisplayName(contact)
  const subtitle = getSubtitle(contact)

  const handlePress = useCallback(() => {
    onPress(contact)
  }, [contact, onPress])

  return (
    <XStack
      py="$3"
      px="$2"
      gap="$3"
      alignItems="center"
      borderRadius="$3"
      cursor="pointer"
      hoverStyle={{ backgroundColor: '$color2' }}
      pressStyle={{ backgroundColor: '$color3' }}
      onPress={handlePress}
    >
      {/* Avatar */}
      <Avatar size="$4" circular>
        {Platform.OS === 'android' && !contact.avatar_url ? (
          <Avatar.Fallback jc="center" ai="center" bc="$color2">
            <IconAccount size="$3" color="$olive" />
          </Avatar.Fallback>
        ) : (
          <>
            <Avatar.Image
              accessibilityLabel={displayName}
              accessibilityRole="image"
              accessible
              src={contact.avatar_url ?? undefined}
            />
            <Avatar.Fallback jc="center" ai="center" bc="$color2">
              <IconAccount size="$3" color="$olive" />
            </Avatar.Fallback>
          </>
        )}
      </Avatar>

      {/* Name and subtitle */}
      <YStack flex={1} overflow="hidden" gap="$0.5">
        <Text
          color="$color12"
          fontSize="$5"
          fontWeight="500"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>

        {subtitle && (
          <Text color="$color10" fontSize="$3" numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        )}
      </YStack>
    </XStack>
  )
})
