import {
  Button,
  Card,
  Paragraph,
  PrimaryButton,
  Spinner,
  useAppToast,
  XStack,
  YStack,
} from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSendCheckClaim } from 'app/utils/useSendCheckClaim'
import { useSendAccount } from 'app/utils/send-accounts'
import { CheckPreviewCard, useCheckPreview } from './components/CheckPreviewCard'
import debug from 'debug'

const log = debug('app:features:check:claim:preview')

interface CheckClaimPreviewScreenProps {
  checkCode: string
}

export function CheckClaimPreviewScreen({ checkCode }: CheckClaimPreviewScreenProps) {
  const router = useRouter()
  const { t } = useTranslation('send')
  const toast = useAppToast()
  const { data: sendAccount, isLoading: isLoadingAccount } = useSendAccount()
  const { claimCheck, isPending: isSubmitting, isReady } = useSendCheckClaim()
  const [claimed, setClaimed] = useState(false)

  // Redirect to public page if not logged in
  useEffect(() => {
    if (!isLoadingAccount && !sendAccount && checkCode) {
      router.replace(`/check/public/${checkCode}`)
    }
  }, [isLoadingAccount, sendAccount, checkCode, router])

  // Use shared preview hook
  const { checkDetails, previewData, isLoading, error } = useCheckPreview(checkCode || null)

  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        ?.map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )

  const canSubmit =
    isReady &&
    checkCode &&
    webauthnCreds.length > 0 &&
    !isSubmitting &&
    checkDetails &&
    !checkDetails.isExpired &&
    !checkDetails.isClaimed

  const onClaim = useCallback(async () => {
    try {
      await claimCheck({ checkCode, webauthnCreds })
      setClaimed(true)
      toast.show(t('check.claim.success'))
    } catch (err) {
      log('Failed to claim check:', err)
      toast.error(err instanceof Error ? err.message : t('check.claim.error'))
    }
  }, [claimCheck, checkCode, webauthnCreds, toast, t])

  // Loading state (including waiting for auth check, redirect, or router hydration)
  if (isLoading || isLoadingAccount || !sendAccount || !checkCode) {
    return (
      <YStack f={1} gap="$5" w="100%" maxWidth={600} ai="center" jc="center">
        <Spinner size="large" />
        <Paragraph color="$color10">{t('check.claim.verifying')}</Paragraph>
      </YStack>
    )
  }

  // Error state
  if (error || !checkDetails) {
    return (
      <YStack f={1} gap="$5" w="100%" maxWidth={600}>
        <Card padded elevation={1} br="$5">
          <YStack ai="center" gap="$4" py="$4">
            <Paragraph color="$color10" size="$4" ta="center">
              {t('check.claim.notFoundMessage')}
            </Paragraph>
            <PrimaryButton onPress={() => router.push('/check')}>
              <PrimaryButton.Text>{t('check.claim.goBack')}</PrimaryButton.Text>
            </PrimaryButton>
          </YStack>
        </Card>
      </YStack>
    )
  }

  // Success state after claiming
  if (claimed) {
    return (
      <YStack f={1} gap="$5" w="100%" maxWidth={600}>
        <Card padded elevation={1} br="$5">
          <YStack ai="center" gap="$4" py="$4">
            <XStack w="$6" h="$6" br="$10" ai="center" jc="center" bc="$primary">
              <Check size="$2" color="$black" />
            </XStack>
            <YStack ai="center" gap="$2">
              <Paragraph color="$color12" fontWeight="600" fontSize="$6">
                {t('check.claim.successTitle')}
              </Paragraph>
              <Paragraph color="$color10" size="$4" ta="center">
                {previewData?.tokens.map((t) => `${t.amount} ${t.symbol}`).join(', ')}{' '}
                {t('check.claim.addedToAccount')}
              </Paragraph>
            </YStack>
          </YStack>
        </Card>

        <PrimaryButton onPress={() => router.push('/')}>
          <PrimaryButton.Text>{t('check.claim.done')}</PrimaryButton.Text>
        </PrimaryButton>
      </YStack>
    )
  }

  // Preview state
  return (
    <YStack f={1} gap="$5" w="100%" maxWidth={600}>
      <CheckPreviewCard checkCode={checkCode} />

      {/* Claim Button */}
      <PrimaryButton disabled={!canSubmit} onPress={onClaim} disabledStyle={{ opacity: 0.5 }}>
        {isSubmitting ? (
          <Spinner color="$black" />
        ) : (
          <PrimaryButton.Text>{t('check.claim.submit')}</PrimaryButton.Text>
        )}
      </PrimaryButton>
    </YStack>
  )
}

export default CheckClaimPreviewScreen
