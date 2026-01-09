/**
 * ActivityAvatar - renders activity avatar with optional linking.
 * Uses activityTransform for type detection, ActivityAvatarFactory for rendering.
 */

import { memo, useMemo } from 'react'
import { styled, useThemeName, XStack } from '@my/ui'
import { Link as SolitoLink } from 'solito/link'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useAddressBook } from 'app/utils/useAddressBook'
import type { Activity } from 'app/utils/zod/activity'
import { transformActivity, createAddressContext } from './utils/activityTransform'
import { ActivityAvatarFactory, getAvatarColors } from './avatars/ActivityAvatarFactory'

const Link = styled(SolitoLink)

// Dummy translation function - we don't need translated strings for avatar
const dummyT = ((key: string) => key) as Parameters<typeof transformActivity>[1]['t']

interface ActivityAvatarProps {
  activity: Activity
}

export const ActivityAvatar = memo(({ activity }: ActivityAvatarProps) => {
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { data: addressBook } = useAddressBook()
  const theme = useThemeName()
  const isDark = theme.includes('dark')
  const colors = useMemo(() => getAvatarColors(isDark), [isDark])

  // Transform activity using the single source of truth
  const row = useMemo(() => {
    const ctx = {
      t: dummyT,
      locale: 'en',
      swapRouters,
      liquidityPools,
      addressBook,
    }
    const addrCtx = createAddressContext(swapRouters, liquidityPools)
    // Dummy formatter - we don't use the date for avatar
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    const now = Date.now()

    return transformActivity(
      activity,
      ctx,
      addrCtx,
      formatter,
      now,
      false, // isFirst - not relevant for avatar
      false, // isLast - not relevant for avatar
      0 // sectionIndex - not relevant for avatar
    )
  }, [activity, swapRouters, liquidityPools, addressBook])

  // Determine if this avatar should be linkable
  const linkHref = useMemo(() => {
    if (row.kind === 'user-transfer' || row.kind === 'referral') {
      const { counterpartSendId } = row
      if (counterpartSendId !== null) {
        return `/profile/${counterpartSendId}`
      }
    }
    return null
  }, [row])

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
