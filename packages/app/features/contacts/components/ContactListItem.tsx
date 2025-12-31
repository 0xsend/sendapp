import { memo } from 'react'
import { Platform } from 'react-native'
import { Avatar, Card, Text, XStack, YStack, type CardProps } from '@my/ui'
import type { ContactView } from '../types'
import { shorten } from 'app/utils/strings'
import { IconAccount, IconHeart, IconBadgeCheckSolid2, IconBase } from 'app/components/icons'
import { useThemeName } from 'tamagui'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { getContactDisplayName } from '../utils/getContactDisplayName'

/**
 * Props for ContactListItem component.
 */
export interface ContactListItemProps {
  /** Contact data from contact_search_result */
  contact: ContactView
  /** Handler when item is pressed */
  onPress?: (contact: ContactView) => void
  /** Whether this is the first item (for styling) */
  isFirst?: boolean
  /** Whether this is the last item (for styling) */
  isLast?: boolean
}

/**
 * Determines the subtitle for a contact.
 *
 * Shows the sendtag if available, otherwise shows send_id or external address.
 */
function getSubtitle(contact: ContactView): string | null {
  // If custom name is set, show the original tag/profile as subtitle
  if (contact.custom_name) {
    if (contact.main_tag_name) return `/${contact.main_tag_name}`
    if (contact.profile_name) return contact.profile_name
  }
  // Show send_id if available
  if (contact.send_id) return `#${contact.send_id}`
  // For external contacts, show chain info
  if (contact.external_address && contact.chain_id) {
    return shorten(contact.external_address, 6, 4)
  }
  return null
}

/**
 * ContactListItem displays a single contact in the list.
 *
 * Features:
 * - Avatar with fallback to IconAccount
 * - Display name with priority: custom_name > profile_name > main_tag_name > truncated_address
 * - Favorite heart indicator
 * - Verified badge for verified users
 * - Chain badge for external contacts (Base chain)
 *
 * @example
 * ```tsx
 * <ContactListItem
 *   contact={contact}
 *   onPress={(c) => navigateToContact(c.contact_id)}
 * />
 * ```
 */
export const ContactListItem = memo(function ContactListItem({
  contact,
  onPress,
  isFirst = false,
  isLast = false,
}: ContactListItemProps) {
  const themeName = useThemeName()
  const isDark = themeName?.includes('dark')
  const hoverStyles = useHoverStyles()

  const displayName = getContactDisplayName(contact)
  const subtitle = getSubtitle(contact)
  const isExternalContact = Boolean(contact.external_address)

  const handlePress = () => {
    onPress?.(contact)
  }

  const borderRadiusStyle: CardProps = {
    borderTopLeftRadius: isFirst ? '$4' : 0,
    borderTopRightRadius: isFirst ? '$4' : 0,
    borderBottomLeftRadius: isLast ? '$4' : 0,
    borderBottomRightRadius: isLast ? '$4' : 0,
  }

  // On native, use transparent background to avoid tint artifacts against page background
  const isNative = Platform.OS !== 'web'

  return (
    <Card
      width="100%"
      height={72}
      elevation={isNative ? 0 : '$0.75'}
      shadowOpacity={isNative ? 0 : undefined}
      ai="center"
      jc="space-between"
      gap="$3"
      px="$3.5"
      py="$2.5"
      bc={isNative ? 'transparent' : '$color1'}
      cursor="pointer"
      hoverStyle={hoverStyles}
      onPress={handlePress}
      flexDirection="row"
      {...(isNative ? {} : borderRadiusStyle)}
    >
      <XStack gap="$3" f={1} ai="center">
        {/* Avatar with verified/chain badge */}
        <ContactAvatar
          avatarUrl={contact.avatar_url}
          displayName={displayName}
          isVerified={contact.is_verified ?? false}
          isExternal={isExternalContact}
          chainId={contact.chain_id}
          isDark={isDark ?? false}
        />

        {/* Name and subtitle */}
        <YStack f={1} overflow="hidden" gap="$1">
          <XStack ai="center" gap="$2">
            <Text
              color="$color12"
              fontSize="$5"
              fontWeight="500"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayName}
            </Text>

            {/* Favorite indicator */}
            {contact.is_favorite && <IconHeart size="$1" color="$red9" />}
          </XStack>

          {subtitle && (
            <Text color="$color10" fontSize="$3" numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </Text>
          )}
        </YStack>
      </XStack>
    </Card>
  )
})

/**
 * Props for ContactAvatar component.
 */
interface ContactAvatarProps {
  avatarUrl: string | null | undefined
  displayName: string
  isVerified: boolean
  isExternal: boolean
  /** Chain ID - can be string or number depending on source */
  chainId: string | number | null | undefined
  isDark: boolean
}

/**
 * Contact avatar with badges.
 */
const ContactAvatar = memo(function ContactAvatar({
  avatarUrl,
  displayName,
  isVerified,
  isExternal,
  chainId,
  isDark,
}: ContactAvatarProps) {
  // Base mainnet chain ID - CAIP-2 format (eip155:8453) or legacy numeric
  const showChainBadge =
    isExternal && (chainId === 'eip155:8453' || chainId === 8453 || chainId === '8453')

  return (
    <XStack position="relative">
      <Avatar size="$4" circular>
        {Platform.OS === 'android' && !avatarUrl ? (
          <Avatar.Fallback jc="center" ai="center" bc="$color2">
            <IconAccount size="$3" color="$olive" />
          </Avatar.Fallback>
        ) : (
          <>
            <Avatar.Image
              testID="contactAvatarImage"
              accessibilityLabel={displayName}
              accessibilityRole="image"
              accessible
              src={avatarUrl ?? undefined}
            />
            <Avatar.Fallback jc="center" ai="center" bc="$color2">
              <IconAccount size="$3" color="$olive" />
            </Avatar.Fallback>
          </>
        )}
      </Avatar>

      {/* Verified badge */}
      {isVerified && (
        <XStack zi={100} pos="absolute" bottom={0} right={0} x="$0.25" y="$0.25">
          <IconBadgeCheckSolid2
            size="$0.9"
            color="$neon8"
            $theme-dark={{ color: '$neon7' }}
            // @ts-expect-error - checkColor is not typed
            checkColor={isDark ? '#082B1B' : '#fff'}
          />
        </XStack>
      )}

      {/* Chain badge for external contacts */}
      {showChainBadge && !isVerified && (
        <XStack zi={100} pos="absolute" bottom={-2} right={-2} bc="$background" br={1000} p="$0.25">
          <IconBase size={14} />
        </XStack>
      )}
    </XStack>
  )
})

export default ContactListItem
