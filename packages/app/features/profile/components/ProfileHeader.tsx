import type { Functions } from '@my/supabase/database.types'
import { Avatar, Card, LinkableAvatar, Paragraph, XStack } from '@my/ui'
import { IconAccount, IconArrowRight } from 'app/components/icons'
import { shorten } from 'app/utils/strings'
import { useRootScreenParams } from 'app/routers/params'

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
  const [rootParams, setRootParams] = useRootScreenParams()

  const handlePress = () => {
    setRootParams({
      ...rootParams,
      profile: rootParams.profile ? undefined : profile?.sendid?.toString(),
    })
  }

  return (
    <Card flexDirection={'row'} jc="space-between" ai="center" padding={'$5'} onPress={handlePress}>
      <XStack ai="center" gap={'$size.1.5'} width={'80%'}>
        <LinkableAvatar size="$6" br="$4" href={profileHref}>
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
        </LinkableAvatar>
        <Paragraph nativeID="profileName" size={'$8'} width={'80%'}>
          {(() => {
            switch (true) {
              case idType === 'address':
                return shorten(recipient, 5, 4)
              case !!profile?.name:
                return profile?.name
              case !!profile?.all_tags?.[0]:
                return `/${profile.all_tags[0]}`
              case !!profile?.sendid:
                return `#${profile?.sendid}`
              default:
                return '??'
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
