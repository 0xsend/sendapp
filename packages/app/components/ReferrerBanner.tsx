import { Fade, Paragraph, Spinner, XStack } from '@my/ui'
import { useReferralCodeQuery } from 'app/utils/useReferralCode'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { AvatarProfile } from 'app/features/profile/AvatarProfile'
import { useTranslation } from 'react-i18next'

/**
 * Displays a compact inline banner showing who referred the user during onboarding.
 * Only shown when a valid referral code is present in storage.
 * Works without authentication by looking up the referrer by tag or refcode.
 */
export function ReferrerBanner() {
  const { data: referralCode, isLoading: isLoadingReferralCode } = useReferralCodeQuery()
  const { t } = useTranslation('common')

  // Try to look up referrer by tag first, then by refcode
  const {
    data: referrerByTag,
    isLoading: isLoadingByTag,
    isFetched: isFetchedByTag,
  } = useProfileLookup('tag', referralCode ?? '')
  const {
    data: referrerByRefcode,
    isLoading: isLoadingByRefcode,
    isFetched: isFetchedByRefcode,
  } = useProfileLookup('refcode', referralCode ?? '')

  // Use the first valid referrer found (by tag or refcode)
  // A valid referrer must have an address (send account) and tag
  const referrer =
    referrerByTag?.address && referrerByTag?.tag
      ? referrerByTag
      : referrerByRefcode?.address && referrerByRefcode?.tag
        ? referrerByRefcode
        : null

  const isLoading =
    isLoadingReferralCode || (referralCode && (isLoadingByTag || isLoadingByRefcode))
  const isFetched = isFetchedByTag && isFetchedByRefcode

  // Don't show anything if no referral code
  if (!referralCode) {
    return null
  }

  // Show loading state while fetching referrer
  if (isLoading && !isFetched) {
    return (
      <XStack ai="center" jc="center" gap="$2">
        <Spinner size="small" color="$color11" />
      </XStack>
    )
  }

  // Don't show if no valid referrer found
  if (!referrer) {
    return null
  }

  return (
    <Fade>
      <XStack ai="center" jc="center" gap="$2">
        <Paragraph
          size="$3"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {t('referral.referredBy')}
        </Paragraph>
        <XStack ai="center" gap="$1.5">
          {referrer.avatar_url && (
            <AvatarProfile
              profile={{
                name: referrer.name,
                avatar_url: referrer.avatar_url,
                is_verified: referrer.is_verified,
              }}
              size="$2"
              br="$2"
              mx={0}
            />
          )}
          <Paragraph size="$3" fontWeight="600" color="$color12">
            /{referrer.tag}
          </Paragraph>
        </XStack>
      </XStack>
    </Fade>
  )
}
