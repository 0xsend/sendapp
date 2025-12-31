import { FadeCard, Paragraph, YStack, Button, Spinner, XStack } from '@my/ui'
import { AlertCircle, CheckCircle, Clock, XCircle } from '@tamagui/lucide-icons'
import type { KycStatus } from '@my/bridge'

interface KycStatusCardProps {
  kycStatus: string
  onStartKyc?: () => void
  isLoading?: boolean
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <CheckCircle size={24} color="$green10" />
    case 'rejected':
      return <XCircle size={24} color="$red10" />
    case 'under_review':
    case 'incomplete':
      return <Clock size={24} color="$yellow10" />
    default:
      return <AlertCircle size={24} color="$lightGrayTextField" />
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'approved':
      return 'Identity Verified'
    case 'rejected':
      return 'Verification Failed'
    case 'under_review':
      return 'Under Review'
    case 'incomplete':
      return 'Verification Incomplete'
    case 'paused':
      return 'Verification Paused'
    case 'offboarded':
      return 'Account Offboarded'
    default:
      return 'Verification Required'
  }
}

function getStatusDescription(status: string): string {
  switch (status) {
    case 'approved':
      return 'You can now receive bank transfers to your account.'
    case 'rejected':
      return 'Your identity verification was not successful. Please contact support.'
    case 'under_review':
      return 'Your verification is being reviewed. This usually takes 1-2 business days.'
    case 'incomplete':
      return 'Please complete your identity verification to enable bank transfers.'
    case 'paused':
      return 'Your verification has been paused. Please contact support.'
    case 'offboarded':
      return 'Your account has been offboarded. Please contact support.'
    default:
      return 'Complete identity verification to deposit via bank transfer.'
  }
}

export function KycStatusCard({ kycStatus, onStartKyc, isLoading }: KycStatusCardProps) {
  const showStartButton = kycStatus === 'not_started' || kycStatus === 'incomplete'

  return (
    <FadeCard>
      <YStack gap="$4">
        <XStack ai="center" gap="$3">
          <StatusIcon status={kycStatus} />
          <Paragraph fontSize="$6" fontWeight={600}>
            {getStatusText(kycStatus)}
          </Paragraph>
        </XStack>

        <Paragraph
          fontSize="$4"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {getStatusDescription(kycStatus)}
        </Paragraph>

        {showStartButton && onStartKyc && (
          <Button
            size="$4"
            theme="green"
            onPress={onStartKyc}
            disabled={isLoading}
            icon={isLoading ? <Spinner size="small" /> : undefined}
          >
            {kycStatus === 'incomplete' ? 'Continue Verification' : 'Start Verification'}
          </Button>
        )}
      </YStack>
    </FadeCard>
  )
}
