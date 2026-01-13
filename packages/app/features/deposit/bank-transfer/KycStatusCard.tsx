import { FadeCard, Paragraph, YStack, XStack, Button, Spinner, Input } from '@my/ui'
import { Check, HelpCircle } from '@tamagui/lucide-icons'

interface KycStatusCardProps {
  kycStatus: string
  isBusinessProfile?: boolean
  isTosAccepted?: boolean
  email?: string
  onEmailChange?: (email: string) => void
  onStartKyc?: () => void
  isLoading?: boolean
  startDisabled?: boolean
  rejectionReasons?: string[]
  isMaxAttemptsExceeded?: boolean
  onInfoPress?: () => void
  children?: React.ReactNode
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getStatusText(status: string, isBusinessProfile: boolean): string {
  switch (status) {
    case 'approved':
      return isBusinessProfile ? 'Business Verified' : 'Identity Verified'
    case 'rejected':
      return 'Verification Failed'
    case 'under_review':
      return 'Under Review'
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

function getStatusDescription(status: string, isBusinessProfile: boolean): string {
  switch (status) {
    case 'approved':
      return 'You can now deposit funds from your bank.'
    case 'rejected':
      return isBusinessProfile
        ? 'Your business verification was not successful.'
        : 'Your identity verification was not successful.'
    case 'under_review':
      return 'Your verification is being reviewed. This usually takes 1-2 business days. Please check your email for any additional requests for information.'
    case 'awaiting_questionnaire':
      return 'We are awaiting for you to fill out the questionnaire. Open the verification link to complete it.'
    case 'awaiting_ubo':
      return 'Your business will remain in this state until all UBO individuals complete KYC. Open the verification link to complete your portion and ask other business partners to finish theirs.'
    case 'paused':
      return 'Your verification has been paused. Please contact support.'
    case 'offboarded':
      return 'Your account has been offboarded. Please contact support.'
    default:
      return isBusinessProfile
        ? 'To deposit from your bank, we need to verify your business. This is a one-time process required by financial regulations.'
        : 'To deposit from your bank, we need to verify your identity. This is a one-time process required by financial regulations.'
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
  isBusinessProfile = false,
  isTosAccepted = false,
  email = '',
  onEmailChange,
  onStartKyc,
  isLoading,
  startDisabled,
  rejectionReasons,
  isMaxAttemptsExceeded = false,
  onInfoPress,
  children,
}: KycStatusCardProps) {
  // Statuses where no user action is possible - either waiting for review or account is terminal
  const statusesWithNoUserAction = ['rejected', 'under_review', 'paused', 'offboarded']
  const showStartButton = !isMaxAttemptsExceeded && !statusesWithNoUserAction.includes(kycStatus)
  const isNewUser = kycStatus === 'not_started'
  const hasValidEmail = isValidEmail(email)

  // Determine button label based on current step
  let buttonLabel = 'Continue Verification'
  if (kycStatus === 'rejected') {
    buttonLabel = 'Try Again'
  } else if (!hasValidEmail) {
    buttonLabel = 'Enter Email to Continue'
  } else if (!isTosAccepted) {
    buttonLabel = 'Accept Terms of Service'
  } else if (isNewUser) {
    buttonLabel = isBusinessProfile ? 'Verify Business' : 'Verify Identity'
  }

  // Show max attempts exceeded message
  if (isMaxAttemptsExceeded && kycStatus === 'rejected') {
    return (
      <FadeCard>
        <YStack gap="$4">
          <Paragraph fontSize="$6" fontWeight={600}>
            Verification Unavailable
          </Paragraph>

          <Paragraph
            fontSize="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            You have exceeded the maximum number of verification attempts. If you believe this was a
            mistake, please contact support@send.app
          </Paragraph>

          {rejectionReasons?.length ? (
            <YStack gap="$2">
              <Paragraph fontSize="$4" fontWeight={600}>
                Last Rejection Reason
              </Paragraph>
              {rejectionReasons.map((reason) => (
                <Paragraph key={reason} fontSize="$4">
                  {reason}
                </Paragraph>
              ))}
            </YStack>
          ) : null}
        </YStack>
      </FadeCard>
    )
  }

  // New user flow with step indicators
  if (isNewUser && onStartKyc) {
    return (
      <FadeCard pos="relative">
        {onInfoPress && (
          <Button
            size="$2"
            circular
            chromeless
            onPress={onInfoPress}
            pressStyle={{ scale: 0.9 }}
            pos="absolute"
            top="$4"
            right="$4"
            zi={1}
          >
            <Button.Icon>
              <HelpCircle size={18} color="$gray10" />
            </Button.Icon>
          </Button>
        )}
        <YStack gap="$4">
          <Paragraph
            fontSize="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
            pr={onInfoPress ? '$8' : '$2'}
          >
            {getStatusDescription(kycStatus, isBusinessProfile)}
          </Paragraph>

          {children}

          <YStack gap="$3" py="$2">
            <StepIndicator
              step={1}
              label="Enter Email Address"
              isComplete={hasValidEmail}
              isActive={!hasValidEmail}
            />
            <StepIndicator
              step={2}
              label="Accept Terms of Service"
              isComplete={isTosAccepted}
              isActive={hasValidEmail && !isTosAccepted}
            />
            <StepIndicator
              step={3}
              label={isBusinessProfile ? 'Verify Your Business' : 'Verify Your Identity'}
              isComplete={false}
              isActive={hasValidEmail && isTosAccepted}
            />
          </YStack>

          <YStack gap="$2">
            <Paragraph fontSize="$3" color="$gray10">
              Email for verification follow-ups
            </Paragraph>
            <Input
              placeholder="you@example.com"
              value={email}
              onChangeText={onEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              size="$4"
            />
          </YStack>

          <Button
            size="$4"
            theme="green"
            onPress={onStartKyc}
            disabled={isLoading || startDisabled || !hasValidEmail}
            icon={isLoading ? <Spinner size="small" /> : undefined}
          >
            {buttonLabel}
          </Button>
        </YStack>
      </FadeCard>
    )
  }

  return (
    <FadeCard pos="relative">
      {onInfoPress && (
        <Button
          size="$2"
          circular
          chromeless
          onPress={onInfoPress}
          pressStyle={{ scale: 0.9 }}
          pos="absolute"
          top="$4"
          right="$4"
          zi={1}
        >
          <Button.Icon>
            <HelpCircle size={18} color="$gray10" />
          </Button.Icon>
        </Button>
      )}
      <YStack gap="$4">
        <Paragraph fontSize="$6" fontWeight={600} pr={onInfoPress ? '$8' : undefined}>
          {getStatusText(kycStatus, isBusinessProfile)}
        </Paragraph>

        <Paragraph
          fontSize="$4"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {getStatusDescription(kycStatus, isBusinessProfile)}
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
