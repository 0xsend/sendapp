import { IconAccount } from 'app/components/icons'
import { AddressAvatar } from 'app/components/avatars'
import { Avatar } from '@my/ui'
import type { Functions } from '@my/supabase/database.types'
import type { Address } from 'viem'
import { isAddress } from 'viem'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'

export default function ConfirmScreenAvatar({
  href,
  profile,
  address,
}: {
  href: string
  profile?: Functions<'profile_lookup'>[number]
  address?: string | null
}) {
  const router = useRouter()

  const onPress = () => {
    router.push(href)
  }

  // Use AddressAvatar for external addresses without a profile avatar
  if (!profile?.avatar_url && address && isAddress(address)) {
    return (
      <Avatar circular size={'$3'} onPress={onPress}>
        <AddressAvatar address={address as Address} size="$3" br="$10" />
      </Avatar>
    )
  }

  return (
    <Avatar circular size={'$3'} onPress={onPress}>
      {Platform.OS === 'android' && !profile?.avatar_url ? (
        <IconAccount size={'$3'} color="$olive" />
      ) : (
        <>
          <Avatar.Image
            src={profile?.avatar_url ?? ''}
            testID="avatarImage"
            accessibilityLabel={profile?.name ?? '??'}
            accessibilityRole="image"
            accessible
          />
          <Avatar.Fallback jc="center">
            <IconAccount size={'$3'} color="$olive" />
          </Avatar.Fallback>
        </>
      )}
    </Avatar>
  )
}
