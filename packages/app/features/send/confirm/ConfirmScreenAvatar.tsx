import { IconAccount } from 'app/components/icons'
import { AddressAvatar } from 'app/components/avatars'
import { Avatar, LinkableAvatar } from '@my/ui'
import type { Functions } from '@my/supabase/database.types'
import type { Address } from 'viem'
import { isAddress } from 'viem'

export default function ConfirmScreenAvatar({
  href,
  profile,
  address,
}: {
  href: string
  profile?: Functions<'profile_lookup'>[number] | null
  address?: string | null
}) {
  // Use AddressAvatar for external addresses without a profile avatar
  if (!profile?.avatar_url && address && isAddress(address)) {
    return (
      <LinkableAvatar circular size={'$3'} href={href}>
        <AddressAvatar address={address as Address} size="$3" br="$10" />
      </LinkableAvatar>
    )
  }

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
