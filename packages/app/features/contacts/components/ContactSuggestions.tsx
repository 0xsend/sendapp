import {
  FastImage,
  isWeb,
  LinearGradient,
  Paragraph,
  Text,
  useTheme,
  useThemeName,
  View,
  XStack,
  YStack,
} from '@my/ui'
import { IconBadgeCheckSolid2 } from 'app/components/icons'
import { useSendScreenParams } from 'app/routers/params'
import { memo, useCallback, useMemo } from 'react'
import { FlatList, Platform } from 'react-native'
import type { ContactView } from '../types'
import { useContacts } from '../hooks/useContacts'

/**
 * Props for ContactSuggestions component.
 */
export interface ContactSuggestionsProps {
  /** Title to display above the suggestions */
  title?: string
  /** Animation delay in ms */
  delay?: number
}

/**
 * ContactSuggestions displays favorite contacts in a horizontal scroll list.
 *
 * Designed to integrate with the send flow - tapping a contact sets the
 * recipient using useSendScreenParams.
 *
 * Selection logic:
 * - If contact has main_tag_name, uses idType: 'tag'
 * - Else if contact has send_id, uses idType: 'sendid'
 * - Else if contact is external (has chain_id and wallet_address), uses idType: 'address'
 *
 * @example
 * ```tsx
 * <ContactSuggestions title="From Contacts" />
 * ```
 */
export const ContactSuggestions = memo(function ContactSuggestions({
  title = 'From Contacts',
  delay = 0,
}: ContactSuggestionsProps) {
  const { contacts, isLoading, error } = useContacts({
    filter: { type: 'favorites' },
  })

  const renderItem = useCallback(({ item }: { item: ContactView }) => {
    return <ContactSuggestionItem contact={item} />
  }, [])

  const keyExtractor = useCallback((item: ContactView, index: number) => {
    return item.contact_id?.toString() ?? String(index)
  }, [])

  // Don't render if no contacts or loading
  if (isLoading || (!contacts.length && !error)) {
    return null
  }

  if (error) {
    return null
  }

  return (
    <YStack gap="$3">
      <Paragraph
        animation={[
          '200ms',
          {
            opacity: { delay },
            transform: { delay },
          },
        ]}
        enterStyle={{ opacity: 0, y: 20 }}
        size="$7"
        fontWeight={600}
        col="$color10"
      >
        {title}
      </Paragraph>
      <View
        animation={[
          '200ms',
          {
            opacity: { delay },
            transform: { delay },
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
          data={contacts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingRight: 24,
            paddingHorizontal: 24,
            paddingVertical: 8,
          }}
          {...Platform.select({
            native: { overflow: 'visible' as const },
          })}
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
    </YStack>
  )
})

/**
 * Props for ContactSuggestionItem component.
 */
interface ContactSuggestionItemProps {
  contact: ContactView
}

/**
 * Individual contact suggestion item in the horizontal list.
 */
const ContactSuggestionItem = memo(function ContactSuggestionItem({
  contact,
}: ContactSuggestionItemProps) {
  const [sendParams, setSendParams] = useSendScreenParams()
  const themeName = useThemeName()
  const isDark = themeName.includes('dark')

  // Determine display label
  const label = useMemo(() => {
    if (contact.main_tag_name) return `/${contact.main_tag_name}`
    if (contact.custom_name) return contact.custom_name
    if (contact.profile_name) return contact.profile_name
    if (contact.send_id) return `#${contact.send_id}`
    if (contact.external_address) {
      const addr = contact.external_address
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }
    return '??'
  }, [contact])

  const isVerified = contact.is_verified ?? false
  const avatarUrl = contact.avatar_url ?? ''

  const onSelect = useCallback(() => {
    const baseParams = JSON.parse(JSON.stringify(sendParams))

    // Priority: tag > sendid > address
    if (contact.main_tag_name) {
      setSendParams({
        ...baseParams,
        idType: 'tag',
        recipient: contact.main_tag_name,
      })
    } else if (contact.send_id) {
      setSendParams({
        ...baseParams,
        idType: 'sendid',
        recipient: String(contact.send_id),
      })
    } else if (contact.external_address && contact.chain_id) {
      setSendParams({
        ...baseParams,
        idType: 'address',
        recipient: contact.external_address,
      })
    }
  }, [contact, sendParams, setSendParams])

  return (
    <YStack
      gap="$2"
      mr="$2"
      $gtLg={{ mr: '$3.5' }}
      elevation={Platform.OS === 'web' ? undefined : '$0.75'}
      cur="pointer"
    >
      <View
        hoverStyle={{ opacity: 0.8 }}
        animation="100ms"
        pressStyle={{ scale: 0.95 }}
        onPress={onSelect}
      >
        <ContactSuggestionImage avatarUrl={avatarUrl} label={label} />

        {isVerified && (
          <XStack zi={100} pos="absolute" bottom={0} right={0} x="$-1" y="$-1">
            <XStack
              pos="absolute"
              x="$-0.5"
              y="$-0.5"
              elevation="$1"
              scale={0.7}
              br={1000}
              inset={0}
            />
            <IconBadgeCheckSolid2
              size="$1"
              scale={0.95}
              color="$neon8"
              $theme-dark={{ color: '$neon7' }}
              // @ts-expect-error - checkColor is not typed
              checkColor={isDark ? '#082B1B' : '#fff'}
            />
          </XStack>
        )}
      </View>
      <Text
        w={74}
        fontSize="$3"
        numberOfLines={1}
        ellipsizeMode="tail"
        color="$color12"
        disableClassName
        ta="center"
      >
        {label}
      </Text>
    </YStack>
  )
})

/**
 * Props for ContactSuggestionImage.
 */
interface ContactSuggestionImageProps {
  avatarUrl: string
  label: string
}

/**
 * Avatar image for contact suggestion.
 */
const ContactSuggestionImage = memo(function ContactSuggestionImage({
  avatarUrl,
  label,
}: ContactSuggestionImageProps) {
  const themeObj = useTheme()
  const fastImageStyle = useMemo(
    () => ({
      backgroundColor: themeObj.background.val,
      borderRadius: 1000_000,
    }),
    [themeObj.background.val]
  )

  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&size=256&format=png&background=86ad7f`

  return (
    <XStack ov="hidden" br={1000_000} elevation="$0.75">
      {!avatarUrl ? (
        <FastImage src={fallbackSrc} width={74} height={74} style={fastImageStyle} />
      ) : (
        <FastImage
          alt={`${label} avatar`}
          width={74}
          height={74}
          src={avatarUrl}
          style={fastImageStyle}
          onError={(e) => {
            if (isWeb) {
              e.target.src = fallbackSrc
            }
          }}
        />
      )}
    </XStack>
  )
})
