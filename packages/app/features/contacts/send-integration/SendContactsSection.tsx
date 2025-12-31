/**
 * Contacts section for the Send page.
 *
 * Displays recent and favorite contacts from the user's contact book as send recipients.
 */

import {
  Avatar,
  Button,
  LinearGradient,
  Paragraph,
  Text,
  useTheme,
  useThemeName,
  View,
  XStack,
  YStack,
} from '@my/ui'
import { getContactDisplayName } from '../utils/getContactDisplayName'
import { IconAccount, IconBadgeCheckSolid2, IconHeart } from 'app/components/icons'
import { useSendScreenParams } from 'app/routers/params'
import { memo, useCallback, useMemo } from 'react'
import { FlatList, Platform } from 'react-native'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { type SendContactItem, useSendPageContacts } from './useFavoriteContacts'

/**
 * SendContactsSection displays contacts for quick selection in the Send flow.
 *
 * Features:
 * - Single horizontal scrolling row of contacts
 * - Sorted by last transaction time (most recent first)
 * - Contacts without transactions sorted by creation date at the end
 * - Limited to 15 contacts maximum
 * - Supports both Send users and external addresses
 * - "View All" link to contacts page
 * - Constrained to app's max-width pattern
 *
 * @example
 * ```tsx
 * <SendContactsSection />
 * ```
 */
export const SendContactsSection = memo(function SendContactsSection() {
  const { data: contacts, isLoading, error } = useSendPageContacts()
  const router = useRouter()
  const { t } = useTranslation('send')

  const hasContacts = contacts && contacts.length > 0

  // Don't render if loading or no contacts (but show if there's an error)
  if (isLoading || (!hasContacts && !error)) {
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
        <ContactsRow contacts={contacts ?? []} />
      )}
    </YStack>
  )
})

/**
 * Single horizontal scrolling row of contacts.
 */
const ContactsRow = memo(function ContactsRow({
  contacts,
}: {
  contacts: SendContactItem[]
}) {
  const theme = useTheme()
  return (
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
        colors={[`${theme.background.val}00`, `${theme.background.val}`]}
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

  // Display label using the shared utility
  // Note: contact.name is already (custom_name ?? profile_name) from the hook
  const label = useMemo(() => {
    return getContactDisplayName({
      custom_name: null, // Don't pass since contact.name already has the priority
      profile_name: contact.name,
      main_tag_name: contact.main_tag_name,
      external_address: contact.external_address,
      send_id: contact.send_id,
    })
  }, [contact.name, contact.main_tag_name, contact.external_address, contact.send_id])

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

        {/* Badge priority: favorite > verified > none */}
        {contact.is_favorite ? (
          <XStack zi={100} pos="absolute" bottom={0} right={0} x="$-1" y="$-1">
            <IconHeart size="$1" color="$red9" />
          </XStack>
        ) : contact.is_verified ? (
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
        ) : null}
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
 * Uses IconAccount fallback matching profile page styling.
 */
const ContactImage = memo(function ContactImage({
  avatarUrl,
  label,
}: {
  avatarUrl: string | null
  label: string
}) {
  // Android-specific fallback handling
  if (Platform.OS === 'android' && !avatarUrl) {
    return (
      <XStack w={74} h={74} jc="center" ai="center" br="$4">
        <IconAccount color="$olive" size="$6" />
      </XStack>
    )
  }

  return (
    <Avatar size={74} br="$4">
      <Avatar.Image src={avatarUrl ?? undefined} alt={`${label} avatar`} />
      <Avatar.Fallback f={1} jc="center" ai="center">
        <IconAccount color="$olive" size="$6" />
      </Avatar.Fallback>
    </Avatar>
  )
})

export default SendContactsSection
