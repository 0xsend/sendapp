import type { Functions } from '@my/supabase/database.types'
import { Avatar, Link, LinkableAvatar, Paragraph, XStack } from '@my/ui'
import { IconAccount, IconArrowRight } from 'app/components/icons'
import { shorten } from 'app/utils/strings'
import { useRouter } from 'next/router'

export const ProfileHeader = ({
  recipient,
  idType,
  profile,
}: {
  profile?: Functions<'profile_lookup'>[number] | null
  idType?: string
  recipient?: string
}) => {
  const { query, pathname } = useRouter()
  const profileHref = profile ? `/profile/${profile?.sendid}` : ''

  const getProfileModalHref = () => {
    const { profile: profileParam, ...queryWithoutProfile } = query

    if (profileParam !== undefined) {
      return {
        pathname,
        query: queryWithoutProfile,
      }
    }

    return {
      pathname,
      query: { ...queryWithoutProfile, profile: profile?.sendid?.toString() },
    }
  }

  return (
    <Link href={getProfileModalHref()}>
      <XStack
        jc="space-between"
        ai="center"
        bg={'$color1'}
        p={'$size.1.5'}
        borderRadius={'$6'}
        padding={'$5'}
        cursor={idType === 'address' ? 'default' : 'pointer'}
      >
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
      </XStack>
    </Link>
  )
}
