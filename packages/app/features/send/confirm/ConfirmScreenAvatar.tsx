import { IconAccount } from 'app/components/icons'
import { Avatar, LinkableAvatar } from '@my/ui'
import type { Functions } from '@my/supabase/database.types'

export default function ConfirmScreenAvatar({
  href,
  profile,
}: {
  href: string
  profile?: Functions<'profile_lookup'>[number] | null
}) {
  return (
    <LinkableAvatar circular size={'$3'} href={href}>
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
    </LinkableAvatar>
  )
}
