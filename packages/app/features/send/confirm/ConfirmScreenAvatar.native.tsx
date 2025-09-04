import { IconAccount } from 'app/components/icons'
import { Avatar } from '@my/ui'
import type { Functions } from '@my/supabase/database.types'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'

export default function ConfirmScreenAvatar({
  href,
  profile,
}: {
  href: string
  profile?: Functions<'profile_lookup'>[number]
}) {
  const router = useRouter()

  const onPress = () => {
    router.push(href)
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
