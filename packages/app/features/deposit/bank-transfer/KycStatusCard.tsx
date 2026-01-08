import { FadeCard, Paragraph, YStack, XStack, Button, Spinner } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import type { KycStatus } from '@my/bridge'

interface KycStatusCardProps {
  kycStatus: string
  isTosAccepted?: boolean
  onStartKyc?: () => void
  isLoading?: boolean
  startDisabled?: boolean
  rejectionReasons?: string[]
  children?: React.ReactNode
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
    case 'awaiting_questionnaire':
      return 'Awaiting Questionnaire'
    case 'awaiting_ubo':
      return 'Awaiting UBO Verification'
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
    case 'awaiting_questionnaire':
      return 'We are awaiting for you to fill out the questionnaire. Open the verification link to complete it.'
    case 'awaiting_ubo':
      return 'Your business will remain in this state until all UBO individuals complete KYC. Open the verification link to complete your portion and ask other business partners to finish theirs.'
    case 'paused':
      return 'Your verification has been paused. Please contact support.'
    case 'offboarded':
      return 'Your account has been offboarded. Please contact support.'
    default:
      return 'To deposit from your bank, we need to verify your identity. This is a one-time process required by financial regulations.'
  }
}

function StepIndicator({
  step,
  label,
  isComplete,
  isActive,
}: {
  step: number
  label: string
  isComplete: boolean
  isActive: boolean
}) {
  return (
    <XStack gap="$3" ai="center">
      <YStack
        w={24}
        h={24}
        br={12}
        ai="center"
        jc="center"
        bg={isComplete || isActive ? '$primary' : '$gray6'}
      >
        {isComplete ? (
          <Check size={14} color="white" />
        ) : (
          <Paragraph fontSize="$2" color="white" fontWeight={600}>
            {step}
          </Paragraph>
        )}
      </YStack>
      <Paragraph
        fontSize="$4"
        color={isComplete || isActive ? '$color12' : '$gray10'}
        fontWeight={isActive ? 600 : 400}
      >
        {label}
      </Paragraph>
    </XStack>
  )
}

export function KycStatusCard({
  kycStatus,
  isTosAccepted = false,
  onStartKyc,
  isLoading,
  startDisabled,
  rejectionReasons,
  children,
}: KycStatusCardProps) {
  const showStartButton =
    kycStatus === 'not_started' ||
    kycStatus === 'incomplete' ||
    kycStatus === 'awaiting_questionnaire' ||
    kycStatus === 'awaiting_ubo' ||
    kycStatus === 'rejected'
  const isNewUser = kycStatus === 'not_started'
  const needsTos = !isTosAccepted && (isNewUser || kycStatus === 'incomplete')

  // Determine button label based on current step
  let buttonLabel = 'Continue Verification'
  if (kycStatus === 'rejected') {
    buttonLabel = 'Try Again'
  } else if (needsTos) {
    buttonLabel = 'Accept Terms of Service'
  } else if (isNewUser || kycStatus === 'incomplete') {
    buttonLabel = 'Verify Identity'
  }

  // New user flow with step indicators
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

          <YStack gap="$3" py="$2">
            <StepIndicator
              step={1}
              label="Accept Terms of Service"
              isComplete={isTosAccepted}
              isActive={!isTosAccepted}
            />
            <StepIndicator
              step={2}
              label="Verify Your Identity"
              isComplete={false}
              isActive={isTosAccepted}
            />
          </YStack>

          {children}
          <Button
            size="$4"
            theme="green"
            onPress={onStartKyc}
            disabled={isLoading || startDisabled}
            icon={isLoading ? <Spinner size="small" /> : undefined}
          >
            {buttonLabel}
          </Button>
        </YStack>
      </FadeCard>
    )
  }

  return (
    <FadeCard>
      <YStack gap="$4">
        <Paragraph fontSize="$6" fontWeight={600}>
          {getStatusText(kycStatus)}
        </Paragraph>

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
            {buttonLabel}
          </Button>
        )}
      </YStack>
    </FadeCard>
  )
}
