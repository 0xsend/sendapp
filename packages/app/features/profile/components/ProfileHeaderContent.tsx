import type { Functions } from '@my/supabase/database.types'
import { Avatar, Card, Paragraph, XStack, type CardProps } from '@my/ui'
import { IconAccount, IconArrowRight } from 'app/components/icons'
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
  return (
    <Card flexDirection={'row'} jc="space-between" ai="center" padding={'$5'} {...props}>
      <XStack ai="center" gap={'$3'} width={'80%'}>
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
