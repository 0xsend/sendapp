import { FadeCard, Paragraph, YStack, XStack, Button, Spinner, Input } from '@my/ui'
import { Check, HelpCircle } from '@tamagui/lucide-icons'

interface KycStatusCardProps {
  kycStatus: string
  isBusinessProfile?: boolean
  isTosAccepted?: boolean
  isNewUser?: boolean
  email?: string
  savedEmail?: string | null
  onEmailChange?: (email: string) => void
  isEditingEmail?: boolean
  onEditEmail?: (editing: boolean) => void
  emailError?: string | null
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
  isNewUser = false,
  email = '',
  savedEmail,
  onEmailChange,
  isEditingEmail = false,
  onEditEmail,
  emailError,
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
  const hasValidEmail = isValidEmail(email)
  // Email is changed if user has entered a different email than what's saved
  const isEmailChanged = savedEmail ? email !== savedEmail : false
  // Show email input if: new user, OR returning user who is editing email
  const showEmailInput = isNewUser || isEditingEmail

  // Determine button label based on current step
  // Email validation only applies to new users - returning users already have email in their KYC link
  let buttonLabel = 'Continue Verification'
  if (kycStatus === 'rejected') {
    buttonLabel = 'Try Again'
  } else if (isNewUser && !hasValidEmail) {
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

  // For new users, email step is complete when they've entered a valid email
  // For returning users, email step is always complete (they already provided it)
  const isEmailStepComplete = isNewUser ? hasValidEmail : true

  // Show step indicators for users who can take action (not in terminal states)
  if (showStartButton && onStartKyc) {
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
              isComplete={isEmailStepComplete}
              isActive={isNewUser && !hasValidEmail}
            />
            <StepIndicator
              step={2}
              label="Accept Terms of Service"
              isComplete={isTosAccepted}
              isActive={isEmailStepComplete && !isTosAccepted}
            />
            <StepIndicator
              step={3}
              label={isBusinessProfile ? 'Verify Your Business' : 'Verify Your Identity'}
              isComplete={false}
              isActive={isEmailStepComplete && isTosAccepted}
            />
          </YStack>

          {/* Email section */}
          <YStack gap="$2">
            <XStack jc="space-between" ai="center">
              <Paragraph
                fontSize="$3"
                color="$lightGrayTextField"
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                To get started, we'll need your email address
              </Paragraph>
              {/* Show edit button for returning users with saved email */}
              {!isNewUser && savedEmail && !isEditingEmail && onEditEmail && (
                <Button size="$2" chromeless onPress={() => onEditEmail(true)} px="$2">
                  <Paragraph fontSize="$3" color="$primary">
                    Edit
                  </Paragraph>
                </Button>
              )}
              {/* Show cancel button when editing */}
              {!isNewUser && isEditingEmail && onEditEmail && (
                <Button
                  size="$2"
                  chromeless
                  onPress={() => {
                    onEditEmail(false)
                    // Reset email to saved value
                    if (savedEmail && onEmailChange) {
                      onEmailChange(savedEmail)
                    }
                  }}
                  px="$2"
                >
                  <Paragraph fontSize="$3" color="$gray10">
                    Cancel
                  </Paragraph>
                </Button>
              )}
            </XStack>

            {/* Show input for new users or when editing */}
            {showEmailInput ? (
              <Input
                placeholder="you@example.com"
                value={email}
                onChangeText={onEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                size="$4"
                bg="$color1"
                bw={1}
                boc="$color3"
                br="$4"
                placeholderTextColor="$gray9"
                focusStyle={{
                  boc: '$primary',
                  bg: '$color1',
                }}
              />
            ) : (
              /* Show saved email as read-only text */
              <Paragraph fontSize="$4" color="$color12">
                {savedEmail || email}
              </Paragraph>
            )}

            {/* Email error from server */}
            {emailError && (
              <Paragraph fontSize="$2" color="$red10">
                {emailError}
              </Paragraph>
            )}
            {/* Email validation feedback */}
            {!emailError && showEmailInput && email.length > 0 && !hasValidEmail && (
              <Paragraph fontSize="$2" color="$red10">
                Please enter a valid email address.
              </Paragraph>
            )}
            {/* Warning when email is changed */}
            {!emailError && hasValidEmail && isEmailChanged && (
              <Paragraph fontSize="$2" color="$orange10">
                Changing your email will require accepting Terms of Service again.
              </Paragraph>
            )}
          </YStack>

          <Button
            size="$4"
            theme="green"
            onPress={onStartKyc}
            disabled={
              isLoading || startDisabled || !!emailError || (showEmailInput && !hasValidEmail)
            }
            icon={isLoading ? <Spinner size="small" /> : undefined}
          >
            {buttonLabel}
          </Button>
        </YStack>
      </FadeCard>
    )
  }

  // Terminal states (under_review, paused, offboarded) - no action possible
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
      </YStack>
    </FadeCard>
  )
}
