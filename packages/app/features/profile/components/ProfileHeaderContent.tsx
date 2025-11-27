import type { Functions } from '@my/supabase/database.types'
import { Avatar, Card, Paragraph, useThemeName, XStack, type CardProps } from '@my/ui'
import { IconAccount, IconArrowRight, IconBadgeCheckSolid2 } from 'app/components/icons'
import { shorten } from 'app/utils/strings'
import { Platform } from 'react-native'

export const ProfileHeaderContent = ({
  recipient,
  idType,
  profile,
  ...props
}: {
  profile?: Functions<'profile_lookup'>[number] | null
  idType?: string
  recipient?: string
} & CardProps) => {
  const theme = useThemeName()
  const isDark = theme.includes('dark')

  return (
    <Card flexDirection={'row'} jc="space-between" ai="center" padding={'$5'} {...props}>
      <XStack ai="center" gap={'$3'} width={'80%'}>
        <XStack position="relative">
          <Avatar size="$6" br="$4">
            {Platform.OS === 'android' && !profile?.avatar_url ? (
              <IconAccount size="$6" color="$olive" />
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
                  <IconAccount size="$6" color="$olive" />
                </Avatar.Fallback>
              </>
            )}
          </Avatar>
          {profile?.is_verified && (
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
        <Paragraph nativeID="profileName" size={'$8'} width={'80%'} lineHeight={28}>
          {(() => {
            switch (true) {
              case idType === 'address':
                return shorten(recipient, 5, 4)
              case !!profile?.name:
                return profile?.name
              case !!profile?.main_tag_name:
                return `/${profile.main_tag_name}`
              case !!profile?.all_tags?.[0]:
                return `/${profile.all_tags[0]}`
              case !!profile?.sendid:
                return `#${profile?.sendid}`
              default:
                return ''
            }
          })()}
        </Paragraph>
      </XStack>
      {profile && (
        <IconArrowRight size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
      )}
    </Card>
  )
}
