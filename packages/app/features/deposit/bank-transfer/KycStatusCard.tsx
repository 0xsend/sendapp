import { FadeCard, Paragraph, YStack, Button, Spinner, XStack } from '@my/ui'
import { AlertCircle, CheckCircle, Clock, XCircle } from '@tamagui/lucide-icons'
import type { KycStatus } from '@my/bridge'

interface KycStatusCardProps {
  kycStatus: string
  onStartKyc?: () => void
  isLoading?: boolean
  startDisabled?: boolean
  rejectionReasons?: string[]
  children?: React.ReactNode
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
      return 'You can now deposit funds from your bank.'
    case 'rejected':
      return 'Your identity verification was not successful. Please contact support.'
    case 'under_review':
      return 'Your verification is being reviewed. This usually takes 1-2 business days.'
    case 'incomplete':
      return 'Complete the verification process to start depositing from your bank.'
    case 'paused':
      return 'Your verification has been paused. Please contact support.'
    case 'offboarded':
      return 'Your account has been offboarded. Please contact support.'
    default:
      return 'To deposit from your bank, we need to verify your identity. This is a one-time process required by financial regulations.'
  }
}

export function KycStatusCard({
  kycStatus,
  onStartKyc,
  isLoading,
  startDisabled,
  rejectionReasons,
  children,
}: KycStatusCardProps) {
  const showStartButton = kycStatus === 'not_started' || kycStatus === 'incomplete'
  const isNewUser = kycStatus === 'not_started'

  // Simplified card for new users - description, optional children (email form), and button
  if (isNewUser && onStartKyc) {
    return (
      <FadeCard>
        <YStack gap="$4">
          <Paragraph
            fontSize="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            {getStatusDescription(kycStatus)}
          </Paragraph>
          {children}
          <Button
            size="$4"
            theme="green"
            onPress={onStartKyc}
            disabled={isLoading || startDisabled}
            icon={isLoading ? <Spinner size="small" /> : undefined}
          >
            Verify Identity
          </Button>
        </YStack>
      </FadeCard>
    )
  }

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

        {kycStatus === 'rejected' && rejectionReasons?.length ? (
          <YStack gap="$2">
            <Paragraph fontSize="$4" fontWeight={600}>
              Reason
            </Paragraph>
            {rejectionReasons.map((reason) => (
              <Paragraph key={reason} fontSize="$4">
                {reason}
              </Paragraph>
            ))}
          </YStack>
        ) : null}

        {showStartButton && onStartKyc && (
          <Button
            size="$4"
            theme="green"
            onPress={onStartKyc}
            disabled={isLoading || startDisabled}
            icon={isLoading ? <Spinner size="small" /> : undefined}
          >
            Continue Verification
          </Button>
        )}
      </YStack>
    </FadeCard>
  )
}
