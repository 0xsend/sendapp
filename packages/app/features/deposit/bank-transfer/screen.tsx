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
import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { BankDetailsCard, BankDetailsCardSkeleton } from './BankDetailsCard'
import { KycStatusCard } from './KycStatusCard'
import {
  useBridgeGeoBlock,
  useKycStatus,
  useInitiateKyc,
  useCreateTransferTemplate,
  useTransferTemplateBankAccountDetails,
} from 'app/features/bank-transfer'
import { useThemeSetting } from '@tamagui/next-theme'
import { useRedirectUri } from 'app/utils/useRedirectUri'

export function BankTransferScreen() {
  const {
    kycStatus,
    isTosAccepted,
    isApproved,
    rejectionReasons,
    isMaxAttemptsExceeded,
    isLoading: kycLoading,
  } = useKycStatus()
  const {
    hasTransferTemplate,
    bankDetails,
    isLoading: templateLoading,
  } = useTransferTemplateBankAccountDetails()
  const initiateKyc = useInitiateKyc()
  const createTransferTemplate = useCreateTransferTemplate()
  const { data: isGeoBlocked, isLoading: isGeoBlockLoading } = useBridgeGeoBlock()
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  // Track which step we're waiting for: 'tos', 'kyc', or null
  const [waitingFor, setWaitingFor] = useState<'tos' | 'kyc' | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const redirectUri = useRedirectUri()

  const handleStartKyc = useCallback(async () => {
    if (isGeoBlocked) {
      return
    }
    try {
      const result = await initiateKyc.mutateAsync({ redirectUri })
      // If TOS is already accepted, go straight to KYC
      // Otherwise, open TOS link first (Bridge requires TOS acceptance before KYC)
      const urlToOpen = isTosAccepted ? result.kycLink : result.tosLink || result.kycLink
      if (urlToOpen) {
        await Linking.openURL(urlToOpen)
        setVerificationUrl(result.kycLink)
        setWaitingFor(isTosAccepted ? 'kyc' : 'tos')
      }
    } catch (error) {
      console.error('Failed to initiate KYC:', error)
    }
  }, [initiateKyc, isGeoBlocked, isTosAccepted, redirectUri])

  const handleOpenVerificationLink = useCallback(() => {
    if (verificationUrl) {
      Linking.openURL(verificationUrl)
    }
  }, [verificationUrl])

  // Stop waiting when the relevant status changes
  useEffect(() => {
    if (waitingFor === 'tos' && isTosAccepted) {
      setWaitingFor(null)
    } else if (waitingFor === 'kyc' && kycStatus !== 'not_started') {
      setWaitingFor(null)
    }
  }, [kycStatus, isTosAccepted, waitingFor])

  // Auto-create transfer template once approved
  const {
    mutate: createTemplate,
    isPending: isTemplateCreating,
    isError: templateCreationError,
  } = createTransferTemplate
  useEffect(() => {
    if (
      !isGeoBlocked &&
      isApproved &&
      !hasTransferTemplate &&
      !templateLoading &&
      !isTemplateCreating &&
      !templateCreationError
    ) {
      createTemplate()
    }
  }, [
    isGeoBlocked,
    isApproved,
    hasTransferTemplate,
    templateLoading,
    isTemplateCreating,
    templateCreationError,
    createTemplate,
  ])

  // Handler to retry transfer template creation
  const handleRetryTemplateCreation = useCallback(() => {
    createTransferTemplate.reset()
    createTransferTemplate.mutate()
  }, [createTransferTemplate])

  // Loading state
  if (kycLoading || isGeoBlockLoading) {
    return (
      <YStack f={1} ai="center" jc="center" py="$8">
        <Spinner size="large" color="$primary" />
      </YStack>
    )
  }

  if (isGeoBlocked) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard ai="center">
          <Paragraph size="$6" fontWeight={600} ta="center">
            Bank transfers aren't available in your region.
          </Paragraph>
          <Paragraph
            ta="center"
            size="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            We can't offer ACH or wire transfers where you're located.
          </Paragraph>
        </FadeCard>
      </YStack>
    )
  }

  // Waiting for TOS or KYC to complete
  if (waitingFor) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard ai="center">
          <Spinner size="large" color={isDarkTheme ? '$primary' : '$color12'} />
          <YStack ai="center" gap="$2">
            <Paragraph size="$8" fontWeight={500} $gtLg={{ size: '$9' }} ta="center">
              Hold tight...
            </Paragraph>
            <Paragraph
              ta="center"
              size="$5"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              {waitingFor === 'tos'
                ? 'Accept the Terms of Service in your browser window.'
                : 'Complete the verification in your browser window.'}
            </Paragraph>
            <Paragraph
              ta="center"
              size="$3"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Already finished? It may take a few seconds to update.
            </Paragraph>
          </YStack>
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
            <KycInfoCard key="info" onDismiss={() => setShowInfo(false)} />
          ) : (
            <KycStatusCard
              key="kyc"
              kycStatus={kycStatus}
              isTosAccepted={isTosAccepted}
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
  if (!hasTransferTemplate) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard>
          <YStack gap="$4">
            <Paragraph fontSize="$6" fontWeight={600}>
              {templateCreationError ? 'Setup Failed' : 'Setting Up Your Account'}
            </Paragraph>
            <Paragraph
              fontSize="$4"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              {templateCreationError
                ? 'We encountered an issue creating your deposit account. Please try again.'
                : "Your identity has been verified. We're now creating your deposit account."}
            </Paragraph>
            {isTemplateCreating && (
              <YStack ai="center" py="$2">
                <Spinner size="small" color="$primary" />
              </YStack>
            )}
            {templateCreationError && (
              <Button
                size="$4"
                theme="green"
                onPress={handleRetryTemplateCreation}
                disabled={isTemplateCreating}
              >
                Try Again
              </Button>
            )}
          </YStack>
        </FadeCard>
      </YStack>
    )
  }

  // Has transfer template - show bank details
  if (templateLoading || !bankDetails) {
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

function KycInfoCard({ onDismiss }: { onDismiss: () => void }) {
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
          Bank transfers let you deposit USD directly from your bank account into your Send wallet,
          where it's automatically converted to USDC. This method has the highest deposit limits on
          Send.
        </Paragraph>

        <YStack gap="$3" py="$2">
          <Paragraph fontSize="$5" fontWeight={600}>
            Why verify your identity?
          </Paragraph>
          <Paragraph
            fontSize="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Financial regulations require us to verify your identity before processing bank
            transfers. This is a one-time process that helps protect you and prevents fraud.
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
