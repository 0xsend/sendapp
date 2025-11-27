import { Avatar, type AvatarProps, useThemeName, XStack } from '@my/ui'
import { IconAccount, IconBadgeCheckSolid2 } from 'app/components/icons'
import { Platform } from 'react-native'

export type AvatarProfileProps = {
  name: string | null
  avatar_url: string | null
  is_verified?: boolean | null
  verified_at?: string | null
} | null

export function AvatarProfile({
  profile,
  $gtSm,
  mx,
  ...rest
}: AvatarProps & { profile?: AvatarProfileProps }) {
  const theme = useThemeName()
  const isDark = theme.includes('dark')
  // Support both is_verified (from profile_lookup) and verified_at (from useUser profile)
  const isVerified = profile?.is_verified || Boolean(profile?.verified_at)

  return (
    <XStack position="relative" mx={mx ?? 'auto'} $gtSm={{ mx: 0, ...$gtSm }}>
      <Avatar testID="avatar" size="$8" br="$4" gap="$2" mx={mx} $gtSm={$gtSm} {...rest}>
        {Platform.OS === 'android' && !profile?.avatar_url ? (
          <IconAccount size="$6" color="$olive" />
        ) : (
          <>
            <Avatar.Image
              testID="avatarImage"
              accessibilityLabel={profile?.name ?? '??'}
              accessibilityRole="image"
              accessible
              src={profile?.avatar_url ?? ''}
            />
            <Avatar.Fallback jc="center" ai="center">
              <IconAccount size="$6" color="$olive" />
            </Avatar.Fallback>
          </>
        )}
      </Avatar>
      {isVerified && (
        <XStack zi={100} pos="absolute" bottom={0} right={0} x="$0.5" y="$0.5">
          <XStack pos="absolute" elevation={'$1'} scale={0.5} br={1000} inset={0} />
          <IconBadgeCheckSolid2
            size="$1"
            scale={0.7}
            color="$neon8"
            $theme-dark={{ color: '$neon7' }}
            // @ts-expect-error - checkColor is not typed
            checkColor={isDark ? '#082B1B' : '#fff'}
          />
        </XStack>
      )}
    </XStack>
  )
}
