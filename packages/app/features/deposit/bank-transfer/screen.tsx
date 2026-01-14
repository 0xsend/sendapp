import {
  YStack,
  XStack,
  Paragraph,
  Spinner,
  Anchor,
  FadeCard,
  Button,
  AnimatePresence,
} from '@my/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Linking } from 'react-native'
import { BankDetailsCard, BankDetailsCardSkeleton } from './BankDetailsCard'
import { KycStatusCard } from './KycStatusCard'
import {
  useBridgeGeoBlock,
  useBridgeCustomer,
  useInitiateKyc,
  useSyncKycStatus,
  useCreateStaticMemo,
  useStaticMemoBankAccountDetails,
} from 'app/features/bank-transfer'
import { useThemeSetting } from '@tamagui/next-theme'
import { useRedirectUri } from 'app/utils/useRedirectUri'
import { useAnalytics } from 'app/provider/analytics'
import { useUser } from 'app/utils/useUser'
import { useBankTransferScreenParams } from 'app/routers/params'

const getErrorType = (error: unknown): 'network' | 'unknown' => {
  const message = error instanceof Error ? error.message : String(error)
  if (
    message.includes('Network') ||
    message.includes('network') ||
    message.includes('Failed to fetch')
  ) {
    return 'network'
  }
  return 'unknown'
}

export function BankTransferScreen() {
  const analytics = useAnalytics()
  const { profile } = useUser()
  const [{ tosSuccess, verificationSuccess }, setScreenParams] = useBankTransferScreenParams()

  const {
    data: customer,
    rejectionReasons,
    isMaxAttemptsExceeded,
    isLoading: kycLoading,
  } = useBridgeCustomer()
  const kycLinkId = customer?.kyc_link_id ?? null
  const kycStatus = customer?.kyc_status ?? 'not_started'
  const isTosAccepted = customer?.tos_status === 'approved'
  const isApproved = customer?.kyc_status === 'approved'
  // User is new if they don't have a bridge_customers record yet (not just based on status)
  const isNewUser = !customer

  // Sync KYC status from Bridge API to DB for faster updates
  // Sync when: has kycLinkId AND not approved AND not (rejected with max attempts)
  const shouldSync = !!kycLinkId && !isApproved && !isMaxAttemptsExceeded
  const { email: savedEmail, isLoading: emailLoading } = useSyncKycStatus(kycLinkId ?? undefined, {
    enabled: shouldSync,
  })
  const { hasStaticMemo, bankDetails, isLoading: memoLoading } = useStaticMemoBankAccountDetails()
  const initiateKyc = useInitiateKyc()
  const createStaticMemo = useCreateStaticMemo()
  const { data: isGeoBlocked, isLoading: isGeoBlockLoading } = useBridgeGeoBlock()
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  // null = user hasn't edited, use savedEmail; string = user's input
  const [emailInput, setEmailInput] = useState<string | null>(null)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Derive email: user input takes precedence, otherwise use saved
  const email = emailInput ?? savedEmail ?? ''

  // Clear email error when email changes
  const setEmail = useCallback((value: string) => {
    setEmailInput(value)
    setEmailError(null)
  }, [])
  // Track which step we're waiting for: 'tos', 'kyc', or null
  // Success params act as early signals - verificationSuccess means show confirming state,
  // tosSuccess means TOS is done so skip to next step (no waiting needed)
  const [waitingFor, setWaitingFor] = useState<'tos' | 'kyc' | null>(() => {
    if (verificationSuccess) return 'kyc'
    // tosSuccess means TOS completed - don't wait, let user proceed to KYC
    if (tosSuccess) return null
    return kycStatus === 'incomplete' ? 'kyc' : null
  })
  // Track if user just returned from successful KYC verification (for UI changes)
  const justCompletedVerification = verificationSuccess
  const [showInfo, setShowInfo] = useState(false)
  const hasTrackedDetailsView = useRef(false)
  const hasTrackedInfoView = useRef(false)
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const baseRedirectUri = useRedirectUri()
  const isBusinessProfile = !!profile?.is_business
  const verificationSubject = isBusinessProfile ? 'business' : 'identity'

  const handleStartKyc = useCallback(async () => {
    if (isGeoBlocked) {
      return
    }
    try {
      analytics.capture({
        name: 'bank_transfer_kyc_started',
        properties: {
          kyc_status: kycStatus,
          has_tos_accepted: isTosAccepted,
        },
      })
      // Build redirectUri with success param so we know user completed the flow
      // when they return (even if DB hasn't synced yet)
      const successParam = isTosAccepted ? 'verificationSuccess' : 'tosSuccess'
      const separator = baseRedirectUri.includes('?') ? '&' : '?'
      const redirectUri = `${baseRedirectUri}${separator}${successParam}=true`
      const result = await initiateKyc.mutateAsync({ redirectUri, email })
      // If TOS is already accepted, go straight to KYC
      // Otherwise, open TOS link first (Bridge requires TOS acceptance before KYC)
      const urlToOpen = isTosAccepted ? result.kycLink : result.tosLink || result.kycLink
      if (urlToOpen) {
        analytics.capture({
          name: 'bank_transfer_kyc_link_opened',
          properties: {
            link_type: !isTosAccepted && result.tosLink ? 'tos' : 'kyc',
            kyc_status: kycStatus,
          },
        })
        await Linking.openURL(urlToOpen)
        setVerificationUrl(result.kycLink)
        setWaitingFor(isTosAccepted ? 'kyc' : 'tos')
      }
    } catch (error) {
      console.error('Failed to initiate KYC:', error)
      // Check if email is already in use
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('already in use')) {
        setEmailError('This email is already in use for verification.')
      }
      analytics.capture({
        name: 'bank_transfer_kyc_failed',
        properties: {
          error_type: getErrorType(error),
        },
      })
    }
  }, [analytics, baseRedirectUri, email, initiateKyc, isGeoBlocked, isTosAccepted, kycStatus])

  const handleOpenVerificationLink = useCallback(() => {
    if (verificationUrl) {
      analytics.capture({
        name: 'bank_transfer_kyc_link_opened',
        properties: {
          link_type: waitingFor === 'tos' ? 'tos' : 'kyc',
          kyc_status: kycStatus,
        },
      })
      Linking.openURL(verificationUrl)
    }
  }, [analytics, kycStatus, verificationUrl, waitingFor])

  // Clear success params from URL after reading them (clean URL)
  useEffect(() => {
    if (tosSuccess) {
      setScreenParams({ tosSuccess: undefined }, { webBehavior: 'replace' })
    }
  }, [tosSuccess, setScreenParams])

  // For new users, guide them through the various steps.
  useEffect(() => {
    if (waitingFor === 'tos' && isTosAccepted) {
      // TOS accepted via DB - clear waiting state
      setWaitingFor(null)
    } else if (waitingFor === 'kyc' && !['incomplete', 'not_started'].includes(kycStatus)) {
      // KYC status changed to a final state (approved, rejected, under_review, etc.)
      // Clear waiting state and URL params
      setWaitingFor(null)
      if (verificationSuccess) {
        setScreenParams({ verificationSuccess: undefined }, { webBehavior: 'replace' })
      }
    }
  }, [kycStatus, isTosAccepted, waitingFor, verificationSuccess, setScreenParams])

  // Auto-create static memo once approved
  const {
    mutate: createMemo,
    isPending: isMemoCreating,
    isError: memoCreationError,
  } = createStaticMemo
  useEffect(() => {
    if (
      !isGeoBlocked &&
      isApproved &&
      !hasStaticMemo &&
      !memoLoading &&
      !isMemoCreating &&
      !memoCreationError
    ) {
      createMemo()
    }
  }, [
    isGeoBlocked,
    isApproved,
    hasStaticMemo,
    memoLoading,
    isMemoCreating,
    memoCreationError,
    createMemo,
  ])

  useEffect(() => {
    if (showInfo && !hasTrackedInfoView.current) {
      analytics.capture({
        name: 'bank_transfer_info_viewed',
        properties: {
          info_type: hasStaticMemo ? 'bank_details' : 'kyc',
        },
      })
      hasTrackedInfoView.current = true
    }

    if (!showInfo) {
      hasTrackedInfoView.current = false
    }
  }, [analytics, hasStaticMemo, showInfo])

  useEffect(() => {
    if (!hasTrackedDetailsView.current && hasStaticMemo && bankDetails && !memoLoading) {
      const hasAch = bankDetails.paymentRails.includes('ach_push')
      const hasWire = bankDetails.paymentRails.includes('wire')

      analytics.capture({
        name: 'bank_transfer_details_viewed',
        properties: {
          account_source: 'static_memo',
          has_ach: hasAch,
          has_wire: hasWire,
        },
      })
      hasTrackedDetailsView.current = true
    }
  }, [analytics, bankDetails, hasStaticMemo, memoLoading])

  // Handler to retry static memo creation
  const handleRetryMemoCreation = useCallback(() => {
    createStaticMemo.reset()
    createStaticMemo.mutate()
  }, [createStaticMemo])

  // Loading state
  // For returning users, wait for email to load to prevent content shift
  const isEmailInitializing = !isNewUser && shouldSync && emailLoading
  if (kycLoading || isGeoBlockLoading || isEmailInitializing) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard>
          <YStack ai="center" jc="center" py="$8">
            <Spinner size="large" color="$primary" />
          </YStack>
        </FadeCard>
      </YStack>
    )
  }

  if (isGeoBlocked) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard ai="center">
          <Paragraph size="$6" fontWeight={600} ta="center">
            {"Bank transfers aren't available in your region."}
          </Paragraph>
          <Paragraph
            ta="center"
            size="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            {'Check back another time, we are actively expanding!'}
          </Paragraph>
        </FadeCard>
      </YStack>
    )
  }

  // Waiting for TOS or KYC to complete if status is not_started or incomplete
  if (waitingFor) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard ai="center">
          <Spinner size="large" color={isDarkTheme ? '$primary' : '$color12'} />
          <YStack ai="center" gap="$2">
            <Paragraph size="$8" fontWeight={500} $gtLg={{ size: '$9' }} ta="center">
              {justCompletedVerification ? 'Almost there!' : 'Hold tight...'}
            </Paragraph>
            <Paragraph
              ta="center"
              size="$5"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              {justCompletedVerification
                ? 'Verification complete. Confirming your details...'
                : waitingFor === 'tos'
                  ? 'Accept the Terms of Service in your browser window.'
                  : 'Complete the verification in your browser window.'}
            </Paragraph>
            {!justCompletedVerification && (
              <Paragraph
                ta="center"
                size="$3"
                color="$lightGrayTextField"
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Already finished verification? It may take a few seconds to update.
              </Paragraph>
            )}
          </YStack>
          {!justCompletedVerification && (
            <Anchor
              size="$4"
              color="$primary"
              onPress={handleOpenVerificationLink}
              cursor="pointer"
              hoverStyle={{ opacity: 0.8 }}
            >
              {waitingFor === 'tos'
                ? 'Open Terms of Service window again'
                : 'Open verification window again'}
            </Anchor>
          )}
        </FadeCard>
      </YStack>
    )
  }

  // Not approved - show KYC status
  if (!isApproved) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <AnimatePresence exitBeforeEnter>
          {showInfo ? (
            <KycInfoCard
              key="info"
              onDismiss={() => setShowInfo(false)}
              isBusinessProfile={isBusinessProfile}
            />
          ) : (
            <KycStatusCard
              key="kyc"
              kycStatus={kycStatus}
              isBusinessProfile={isBusinessProfile}
              isTosAccepted={isTosAccepted}
              isNewUser={isNewUser}
              email={email}
              savedEmail={savedEmail}
              onEmailChange={setEmail}
              isEditingEmail={isEditingEmail}
              onEditEmail={setIsEditingEmail}
              emailError={emailError}
              rejectionReasons={rejectionReasons}
              isMaxAttemptsExceeded={isMaxAttemptsExceeded}
              onStartKyc={handleStartKyc}
              isLoading={initiateKyc.isPending}
              onInfoPress={() => setShowInfo(true)}
            />
          )}
        </AnimatePresence>
      </YStack>
    )
  }

  // Approved but setting up deposit account (auto-creating in background)
  if (!hasStaticMemo) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard>
          <YStack gap="$4">
            <Paragraph fontSize="$6" fontWeight={600}>
              {memoCreationError ? 'Setup Failed' : 'Setting Up Your Account'}
            </Paragraph>
            <Paragraph
              fontSize="$4"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              {memoCreationError
                ? 'We encountered an issue creating your deposit account. Please try again.'
                : `Your ${verificationSubject} has been verified. We're now creating your deposit account.`}
            </Paragraph>
            {isMemoCreating && (
              <YStack ai="center" py="$2">
                <Spinner size="small" color="$primary" />
              </YStack>
            )}
            {memoCreationError && (
              <Button
                size="$4"
                theme="green"
                onPress={handleRetryMemoCreation}
                disabled={isMemoCreating}
              >
                Try Again
              </Button>
            )}
          </YStack>
        </FadeCard>
      </YStack>
    )
  }

  // Has static memo - show bank details
  if (memoLoading || !bankDetails) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <BankDetailsCardSkeleton />
      </YStack>
    )
  }

  return (
    <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
      <AnimatePresence exitBeforeEnter>
        {showInfo ? (
          <BankDetailsInfoCard
            key="info"
            onDismiss={() => setShowInfo(false)}
            paymentRails={bankDetails.paymentRails}
          />
        ) : (
          <BankDetailsCard
            key="details"
            bankName={bankDetails.bankName}
            routingNumber={bankDetails.routingNumber}
            accountNumber={bankDetails.accountNumber}
            beneficiaryName={bankDetails.beneficiaryName}
            depositMessage={bankDetails.depositMessage}
            paymentRails={bankDetails.paymentRails}
            onInfoPress={() => setShowInfo(true)}
          />
        )}
      </AnimatePresence>
    </YStack>
  )
}

function StepItem({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <XStack gap="$2.5" ai="flex-start">
      <XStack w={20} h={20} br="$10" bc="$primary" ai="center" jc="center" flexShrink={0}>
        <Paragraph fontSize="$1" color="$black" fontWeight="600">
          {step}
        </Paragraph>
      </XStack>
      <Paragraph
        fontSize="$4"
        color="$lightGrayTextField"
        $theme-light={{ color: '$darkGrayTextField' }}
        f={1}
        pt={2}
      >
        {children}
      </Paragraph>
    </XStack>
  )
}

function KycInfoCard({
  onDismiss,
  isBusinessProfile = false,
}: {
  onDismiss: () => void
  isBusinessProfile?: boolean
}) {
  return (
    <FadeCard
      animation="200ms"
      y={0}
      opacity={1}
      enterStyle={{ y: 20, opacity: 0 }}
      exitStyle={{ y: 20, opacity: 0 }}
    >
      <YStack gap="$4">
        <Paragraph fontSize="$6" fontWeight={600}>
          About Bank Transfers
        </Paragraph>

        <Paragraph
          fontSize="$4"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Bank transfers let you deposit USD directly from your bank account into your Send account,
          where it's automatically converted to USDC. This method has the highest deposit limits on
          Send.
        </Paragraph>

        <YStack gap="$3" py="$2">
          <Paragraph fontSize="$5" fontWeight={600}>
            {isBusinessProfile ? 'Why verify your business?' : 'Why verify your identity?'}
          </Paragraph>
          <Paragraph
            fontSize="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Financial regulations require us to verify your{' '}
            {isBusinessProfile ? 'business' : 'identity'} before processing bank transfers. This is
            a one-time process that helps protect you and prevents fraud.
          </Paragraph>
        </YStack>

        <YStack gap="$3">
          <Paragraph fontSize="$5" fontWeight={600}>
            What you'll need
          </Paragraph>
          <YStack gap="$2" pl="$2">
            <Paragraph
              fontSize="$4"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              • A valid government-issued ID
            </Paragraph>
            <Paragraph
              fontSize="$4"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              • A few minutes to complete verification
            </Paragraph>
          </YStack>
        </YStack>

        <Button size="$4" theme="green" onPress={onDismiss} mt="$2">
          Got it
        </Button>
      </YStack>
    </FadeCard>
  )
}

function BankDetailsInfoCard({
  onDismiss,
  paymentRails,
}: {
  onDismiss: () => void
  paymentRails: string[]
}) {
  const hasAch = paymentRails.includes('ach_push')
  const hasWire = paymentRails.includes('wire')
  const transferType =
    hasAch && hasWire ? 'ACH or wire transfer' : hasAch ? 'ACH transfer' : 'wire transfer'

  return (
    <FadeCard
      animation="200ms"
      y={0}
      opacity={1}
      enterStyle={{ y: 20, opacity: 0 }}
      exitStyle={{ y: 20, opacity: 0 }}
    >
      <YStack gap="$4">
        <Paragraph fontSize="$6" fontWeight={600}>
          How to Deposit
        </Paragraph>

        <Paragraph
          fontSize="$4"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Use your bank's {transferType} feature to deposit USD to your Send account.
        </Paragraph>

        <YStack gap="$2.5" mt="$1">
          <StepItem step={1}>Log into your bank's website or app</StepItem>
          <StepItem step={2}>Start a new {transferType}</StepItem>
          <StepItem step={3}>Enter the routing and account numbers shown</StepItem>
          <StepItem step={4}>
            <Paragraph fontSize="$4" fontWeight={600} color="$color12">
              Include the memo exactly as shown
            </Paragraph>
            {' — this is required to credit your account'}
          </StepItem>
          <StepItem step={5}>Submit the transfer</StepItem>
        </YStack>

        <YStack gap="$3">
          <Paragraph fontSize="$5" fontWeight={600}>
            Timing
          </Paragraph>
          <Paragraph
            fontSize="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            {hasAch && hasWire
              ? 'ACH transfers typically arrive in 1-3 business days. Wire transfers are usually same-day.'
              : hasAch
                ? 'ACH transfers typically arrive in 1-3 business days.'
                : 'Wire transfers are usually same-day.'}
          </Paragraph>
        </YStack>

        <YStack gap="$3">
          <Paragraph fontSize="$5" fontWeight={600}>
            Important
          </Paragraph>
          <Paragraph
            fontSize="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Include the memo exactly as shown. Missing or incorrect memos may result in delay and
            loss of funds.
          </Paragraph>
        </YStack>

        <Button size="$4" theme="green" onPress={onDismiss} mt="$2">
          Got it
        </Button>
      </YStack>
    </FadeCard>
  )
}
