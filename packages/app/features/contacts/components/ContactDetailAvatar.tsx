import { Button, Input, Spinner, Text, XStack, YStack } from '@my/ui'
import { IconAccount, IconStar, IconStarOutline } from 'app/components/icons'
import { AvatarProfile } from 'app/features/profile/AvatarProfile'
import { memo } from 'react'
import { CONTACTS_CUSTOM_NAME_MAX } from '../constants'
import { useContactDetail } from './ContactDetailContext'

/**
 * Avatar section with name input/display, tags, and favorite button.
 */
export const ContactDetailAvatar = memo(function ContactDetailAvatar() {
  const {
    contact,
    displayName,
    profileForAvatar,
    isEditing,
    editState,
    updateEditField,
    localIsFavorite,
    handleToggleFavorite,
    isTogglingFavorite,
    isMutating,
  } = useContactDetail()

  return (
    <XStack gap="$4" alignItems="center">
      {contact.avatar_url || contact.profile_name ? (
        <AvatarProfile profile={profileForAvatar} size="$7" />
      ) : (
        <XStack
          width="$7"
          height="$7"
          backgroundColor="$color4"
          borderRadius="$4"
          alignItems="center"
          justifyContent="center"
        >
          <IconAccount size="$5" color="$color11" />
        </XStack>
      )}

      <YStack flex={1} gap="$1">
        {isEditing && editState ? (
          <Input
            value={editState.customName}
            onChangeText={(v) => updateEditField('customName', v)}
            placeholder="Display name"
            placeholderTextColor="$color10"
            maxLength={CONTACTS_CUSTOM_NAME_MAX}
            size="$4"
            color="$color12"
            backgroundColor="$color3"
            borderColor="$color6"
          />
        ) : (
          <Text fontSize="$6" fontWeight="600" numberOfLines={1}>
            {displayName}
          </Text>
        )}

        {/* Sendtags - only show if displayName is not already showing the tag */}
        {contact.tags && contact.tags.length > 0 && !isEditing && !displayName.startsWith('/') && (
          <Text fontSize="$3" color="$color10">
            /{contact.tags.join(', /')}
          </Text>
        )}

        {/* External address */}
        {contact.external_address && (
          <Text fontSize="$2" color="$color10" fontFamily="$mono">
            {contact.external_address}
          </Text>
        )}
      </YStack>

      {/* Favorite button */}
      <Button
        testID="favoriteButton"
        size="$4"
        circular
        chromeless
        onPress={handleToggleFavorite}
        disabled={isMutating}
        aria-pressed={localIsFavorite}
        icon={
          isTogglingFavorite ? (
            <Spinner size="small" />
          ) : localIsFavorite ? (
            <IconStar size={24} color="$yellow10" />
          ) : (
            <IconStarOutline size={24} color="$color10" />
          )
        }
      />
    </XStack>
  )
})
