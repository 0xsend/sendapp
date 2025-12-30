/**
 * Contacts section for the Send page.
 *
 * Displays recent and favorite contacts from the user's contact book as send recipients.
 */

import {
  Button,
  FastImage,
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
import { shorten } from 'app/utils/strings'
import { memo, useCallback, useMemo } from 'react'
import { FlatList, Platform } from 'react-native'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { type SendContactItem, useFavoriteContacts, useRecentContacts } from './useFavoriteContacts'

/**
 * SendContactsSection displays recent and favorite contacts for quick selection in the Send flow.
 *
 * Features:
 * - Horizontal scrolling list of recent contacts
 * - Horizontal scrolling list of favorite contacts
 * - Supports both Send users and external addresses
 * - "View All" link to contacts page
 *
 * @example
 * ```tsx
 * <SendContactsSection />
 * ```
 */
export const SendContactsSection = memo(function SendContactsSection() {
  const {
    data: favoriteContacts,
    isLoading: isLoadingFavorites,
    error: favoritesError,
  } = useFavoriteContacts()
  const {
    data: recentContacts,
    isLoading: isLoadingRecent,
    error: recentError,
  } = useRecentContacts()
  const router = useRouter()
  const { t } = useTranslation('send')

  const hasFavorites = favoriteContacts && favoriteContacts.length > 0
  const hasRecent = recentContacts && recentContacts.length > 0
  const isLoading = isLoadingFavorites || isLoadingRecent
  const error = favoritesError || recentError

  // Don't render if loading or no contacts (but show if there's an error)
  if (isLoading || (!hasFavorites && !hasRecent && !error)) {
    return null
  }

  const handleViewAll = () => {
    router.push('/contacts')
  }

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Paragraph
          animation={[
            '200ms',
            {
              opacity: { delay: 50 },
              transform: { delay: 50 },
            },
          ]}
          enterStyle={{ opacity: 0, y: 20 }}
          size="$7"
          fontWeight={600}
          col="$color10"
        >
          {t('suggestions.contacts', { defaultValue: 'Contacts' })}
        </Paragraph>
        <Button
          size="$2"
          chromeless
          onPress={handleViewAll}
          animation="100ms"
          hoverStyle={{ opacity: 0.7 }}
        >
          <Button.Text textDecorationLine="underline" color="$color10" fontSize="$3">
            {t('suggestions.viewAll', { defaultValue: 'View All' })}
          </Button.Text>
        </Button>
      </XStack>

      {error ? (
        <Paragraph color="$error">
          {error.message?.split('.')[0] ?? 'Error loading contacts'}
        </Paragraph>
      ) : (
        <YStack gap="$4">
          {/* Favorites section */}
          {hasFavorites && (
            <ContactsList
              title={t('suggestions.favorites', { defaultValue: 'Favorites' })}
              contacts={favoriteContacts}
            />
          )}

          {/* Recent contacts section */}
          {hasRecent && (
            <ContactsList
              title={t('suggestions.recent', { defaultValue: 'Recent' })}
              contacts={recentContacts}
            />
          )}
        </YStack>
      )}
    </YStack>
  )
})

/**
 * Horizontal scrolling list of contacts.
 */
const ContactsList = memo(function ContactsList({
  title,
  contacts,
}: {
  title: string
  contacts: SendContactItem[]
}) {
  return (
    <YStack gap="$2">
      <Text fontSize="$3" color="$color11" fontWeight="500">
        {title}
      </Text>
      <View
        animation={[
          '200ms',
          {
            opacity: { delay: 50 },
            transform: { delay: 50 },
          },
        ]}
        enterStyle={{ opacity: 0, y: 10 }}
        exitStyle={{ opacity: 0, y: 10 }}
        mx={-24}
        pos="relative"
      >
        <FlatList
          horizontal
          bounces
          data={contacts}
          renderItem={({ item }) => <ContactSuggestion contact={item} />}
          keyExtractor={(item) => String(item.contact_id)}
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
    </YStack>
  )
})

/**
 * Individual contact suggestion item.
 */
const ContactSuggestion = memo(function ContactSuggestion({
  contact,
}: { contact: SendContactItem }) {
  const [sendParams, setSendParams] = useSendScreenParams()
  const themeName = useThemeName()
  const isDark = themeName.includes('dark')

  // Display label
  const label = useMemo(() => {
    if (contact.main_tag_name) return `/${contact.main_tag_name}`
    if (contact.name) return contact.name
    if (contact.send_id) return `#${contact.send_id}`
    if (contact.external_address) return shorten(contact.external_address, 4, 4)
    return '??'
  }, [contact])

  const onSelect = useCallback(() => {
    const _sendParams = { ...sendParams }

    if (contact.main_tag_name) {
      setSendParams({
        ..._sendParams,
        idType: 'tag',
        recipient: contact.main_tag_name,
      })
    } else if (contact.send_id) {
      setSendParams({
        ..._sendParams,
        idType: 'sendid',
        recipient: String(contact.send_id),
      })
    } else if (contact.external_address) {
      setSendParams({
        ..._sendParams,
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
        <ContactImage avatarUrl={contact.avatar_url} label={label} />

        {contact.is_verified && (
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
 * Contact avatar image.
 */
const ContactImage = memo(function ContactImage({
  avatarUrl,
  label,
}: {
  avatarUrl: string | null
  label: string
}) {
  const themeObj = useTheme()
  const fastImageStyle = useMemo(
    () => ({
      backgroundColor: themeObj.background.val,
      borderRadius: 1000_000,
    }),
    [themeObj.background.val]
  )

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&size=256&format=png&background=86ad7f`

  return (
    <XStack ov="hidden" br={1000_000} elevation="$0.75">
      <FastImage
        alt={`${label} avatar`}
        width={74}
        height={74}
        src={avatarUrl ?? fallbackUrl}
        style={fastImageStyle}
        onError={(e: { target: { src: string } }) => {
          if (Platform.OS === 'web') {
            e.target.src = fallbackUrl
          }
        }}
      />
    </XStack>
  )
})

export default SendContactsSection
