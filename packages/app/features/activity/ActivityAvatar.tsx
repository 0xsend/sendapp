/**
 * ActivityAvatar - renders activity avatar with optional linking.
 * Uses useActivityRow for transform, ActivityAvatarFactory for rendering.
 */

import { memo, useMemo } from 'react'
import { styled, useThemeName, XStack } from '@my/ui'
import { Link as SolitoLink } from 'solito/link'
import type { Activity } from 'app/utils/zod/activity'
import { useActivityRow } from './utils/useActivityRow'
import { ActivityAvatarFactory, getAvatarColors } from './avatars/ActivityAvatarFactory'

const Link = styled(SolitoLink)

interface ActivityAvatarProps {
  activity: Activity
}

export const ActivityAvatar = memo(({ activity }: ActivityAvatarProps) => {
  const row = useActivityRow(activity)
  const theme = useThemeName()
  const isDark = theme.includes('dark')
  const colors = useMemo(() => getAvatarColors(isDark), [isDark])

  // Determine if this avatar should be linkable
  const linkHref = useMemo(() => {
    if (!row) return null
    if (row.kind === 'user-transfer' || row.kind === 'referral') {
      const { counterpartSendId } = row
      if (counterpartSendId !== null) {
        return `/profile/${counterpartSendId}`
      }
    }
    return null
  }, [row])

  if (!row) return null

  const avatar = <ActivityAvatarFactory item={row} colors={colors} isDark={isDark} />

  if (linkHref) {
    return (
      <XStack
        onPress={(e) => {
          e.stopPropagation()
        }}
      >
        <Link href={linkHref} br="$10">
          {avatar}
        </Link>
      </XStack>
    )
  }

  return avatar
})
ActivityAvatar.displayName = 'ActivityAvatar'

// Keep the old export for backward compatibility
export default ActivityAvatar
