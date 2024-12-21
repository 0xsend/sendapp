import type { Functions } from '@my/supabase/database.types'
import { Paragraph, XStack } from '@my/ui'
import { AvatarProfile } from 'app/features/profile/AvatarProfile'
import { IconArrowRight } from 'app/components/icons'
import { shorten } from 'app/utils/strings'

export const ProfileHeader = ({
  onPress,
  recipient,
  idType,
  profile,
}: {
  profile?: Functions<'profile_lookup'>[number] | null
  onPress: () => void
  idType?: string
  recipient?: string
}) => {
  const handlePress = () => {
    if (!profile) {
      return
    }

    onPress()
  }

  return (
    <XStack
      jc="space-between"
      ai="center"
      bg={'$color1'}
      p={'$size.1.5'}
      borderRadius={'$6'}
      padding={'$5'}
      onPress={handlePress}
      cursor={idType === 'address' ? 'default' : 'pointer'}
    >
      <XStack ai="center" gap={'$size.1.5'} width={'80%'}>
        <AvatarProfile profile={profile} mx="none" size="$6" />
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
