import { Button, XStack, Paragraph } from '@my/ui'
import { ChevronUp, ChevronDown } from '@tamagui/lucide-icons'
import { IconBadgeCheckSolid } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'

interface CantonWalletStatusProps {
  hasRewardsInLatestDistribution?: boolean
  isExpanded: boolean
  onToggle: () => void
}

export function CantonWalletStatus({
  hasRewardsInLatestDistribution,
  isExpanded,
  onToggle,
}: CantonWalletStatusProps) {
  const { profile } = useUser()
  const cantonVerification = profile?.canton_party_verifications?.[0]

  const shouldShowVerificationOption = !cantonVerification && hasRewardsInLatestDistribution

  const shouldShowStatus = !!cantonVerification

  if (!shouldShowVerificationOption && !shouldShowStatus) {
    return null
  }

  if (shouldShowStatus) {
    return (
      <XStack ai="center" gap="$2">
        <Paragraph>Canton Wallet Address Verified</Paragraph>
        <IconBadgeCheckSolid
          size={'$1.5'}
          color={'$primary'}
          $theme-light={{ color: '$color12' }}
        />
      </XStack>
    )
  }

  return (
    <Button chromeless unstyled onPress={onToggle}>
      <XStack ai="center" gap="$2">
        <Paragraph>Verify Canton Wallet Address</Paragraph>

        {isExpanded ? (
          <ChevronUp size={'$1.5'} color="$primary" $theme-light={{ color: '$color12' }} />
        ) : (
          <ChevronDown size={'$1.5'} color="$primary" $theme-light={{ color: '$color12' }} />
        )}
      </XStack>
    </Button>
  )
}
