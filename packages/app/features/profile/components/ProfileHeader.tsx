import type { Functions } from '@my/supabase/database.types'
import { Avatar, Card, LinkableAvatar, Paragraph, XStack } from '@my/ui'
import { IconAccount, IconArrowRight } from 'app/components/icons'
import { shorten } from 'app/utils/strings'
import { Platform } from 'react-native'
import { useRouter } from 'solito/router'

export const ProfileHeader = ({
  recipient,
  idType,
  profile,
}: {
  profile?: Functions<'profile_lookup'>[number] | null
  idType?: string
  recipient?: string
}) => {
  const profileHref = profile ? `/profile/${profile?.sendid}` : ''
  const router = useRouter()

  const handlePressOut = () => router.push(`/profile/${profile?.sendid}`)

  return (
    <Card
      flexDirection={'row'}
      jc="space-between"
      ai="center"
      padding={'$5'}
      onPressOut={handlePressOut}
    >
      <XStack ai="center" gap={'$3'} width={'80%'}>
        <LinkableAvatar
          size="$6"
          br="$4"
          href={profileHref}
          {...(Platform.OS === 'web'
            ? {
                onPressOut: (e) => {
                  e.stopPropagation()
                },
              }
            : {})}
        >
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
        </LinkableAvatar>
        <Paragraph nativeID="profileName" size={'$8'} width={'80%'}>
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
        <IconArrowRight
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
      )}
    </Card>
  )
}
