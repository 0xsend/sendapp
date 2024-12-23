import type { Functions } from '@my/supabase/database.types'
import { LinkableAvatar, Paragraph, XStack, Avatar } from '@my/ui'
import { IconArrowRight, IconAccount } from 'app/components/icons'
import { shorten } from 'app/utils/strings'

export const ProfileHeader = ({
  onPressOut,
  recipient,
  idType,
  profile,
}: {
  profile?: Functions<'profile_lookup'>[number] | null
  onPressOut: () => void
  idType?: string
  recipient?: string
}) => {
  const href = profile ? `/profile/${profile?.sendid}` : ''

  const handlePressOut = () => {
    if (!profile) {
      return
    }

    onPressOut()
  }

  return (
    <XStack
      jc="space-between"
      ai="center"
      bg={'$color1'}
      p={'$size.1.5'}
      borderRadius={'$6'}
      padding={'$5'}
      onPressOut={handlePressOut}
      cursor={idType === 'address' ? 'default' : 'pointer'}
    >
      <XStack ai="center" gap={'$size.1.5'} width={'80%'}>
        <LinkableAvatar
          size="$6"
          br="$4"
          href={href}
          onPressOut={(e) => {
            e.stopPropagation()
          }}
        >
          <Avatar.Image src={profile?.avatar_url ?? ''} />
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
  )
}
