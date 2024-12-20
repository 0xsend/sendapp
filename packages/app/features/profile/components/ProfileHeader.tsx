import type { Functions } from '@my/supabase/database.types'
import { Paragraph, XStack } from '@my/ui'
import { AvatarProfile } from 'app/features/profile/AvatarProfile'
import { IconArrowRight } from 'app/components/icons'

export const ProfileHeader = ({
  otherUserProfile,
  onPress,
}: {
  otherUserProfile: Functions<'profile_lookup'>[number]
  onPress: () => void
}) => {
  return (
    <XStack
      jc="space-between"
      ai="center"
      bg={'$color1'}
      p={'$size.1.5'}
      borderRadius={'$6'}
      padding={'$5'}
      onPress={onPress}
      cursor={'pointer'}
    >
      <XStack ai="center" gap={'$size.1.5'} width={'80%'}>
        <AvatarProfile profile={otherUserProfile} mx="none" size="$6" />
        <Paragraph nativeID="profileName" size={'$8'} width={'80%'}>
          {otherUserProfile.name ||
            (otherUserProfile.all_tags?.[0] ? `/${otherUserProfile.all_tags[0]}` : '??')}
        </Paragraph>
      </XStack>
      <IconArrowRight
        size={'$1.5'}
        $theme-dark={{ color: '$primary' }}
        $theme-light={{ color: '$color12' }}
      />
    </XStack>
  )
}
