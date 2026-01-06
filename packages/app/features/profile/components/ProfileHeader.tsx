import type { Functions } from '@my/supabase/database.types'
import { Link } from 'solito/link'
import { ProfileHeaderContent } from 'app/features/profile/components/ProfileHeaderContent'
import { isAddress } from 'viem'

export default function ProfileHeader({
  recipient,
  idType,
  profile,
}: {
  profile?: Functions<'profile_lookup'>[number] | null
  idType?: string
  recipient?: string
}) {
  // Determine the href: use sendid for profiles, or the address for external addresses
  const href = profile?.sendid
    ? `/profile/${profile.sendid}`
    : idType === 'address' && recipient && isAddress(recipient)
      ? `/profile/${recipient}`
      : undefined

  // If no valid href, don't wrap in a link
  if (!href) {
    return <ProfileHeaderContent profile={profile} idType={idType} recipient={recipient} />
  }

  return (
    <Link href={href}>
      <ProfileHeaderContent profile={profile} idType={idType} recipient={recipient} />
    </Link>
  )
}
