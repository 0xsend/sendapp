import { Button, Card, Paragraph, Spinner, useAppToast, XStack, YStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useState, useCallback, useMemo } from 'react'
import { useSendCheckClaim } from 'app/utils/useSendCheckClaim'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSearchParams } from 'solito/navigation'
import { CheckPreviewCard, useCheckPreview } from './components/CheckPreviewCard'
import debug from 'debug'

const log = debug('app:features:check:claim:preview')

export function CheckClaimPreviewScreen() {
  const router = useRouter()
  const { t } = useTranslation('send')
  const toast = useAppToast()
  const searchParams = useSearchParams()
  const { data: sendAccount } = useSendAccount()
  const { claimCheck, isPending: isSubmitting, isReady } = useSendCheckClaim()
  const [claimed, setClaimed] = useState(false)

  // Get check code from URL params (includes chain)
  const checkCode = searchParams?.get('code') ?? ''

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

  // Loading state
  if (isLoading) {
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
            <Paragraph color="$error" size="$5" fontWeight="600">
              {t('check.claim.notFound')}
            </Paragraph>
            <Button size="$4" variant="outlined" onPress={() => router.push('/check/claim')}>
              <Button.Text>{t('check.claim.tryAgain')}</Button.Text>
            </Button>
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
            <XStack
              w="$6"
              h="$6"
              br="$10"
              ai="center"
              jc="center"
              bc="$primary"
              $theme-light={{ bc: '$color12' }}
            >
              <Check size="$2" color="$color1" />
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

        <Button
          size="$5"
          onPress={() => router.push('/')}
          bc="$primary"
          $theme-light={{ bc: '$color12' }}
        >
          <Button.Text color="$color1" fontWeight="600">
            {t('check.claim.done')}
          </Button.Text>
        </Button>
      </YStack>
    )
  }

  // Preview state
  return (
    <YStack f={1} gap="$5" w="100%" maxWidth={600}>
      <CheckPreviewCard checkCode={checkCode} />

      {/* Claim Button */}
      <Button
        size="$5"
        disabled={!canSubmit}
        onPress={onClaim}
        bc="$primary"
        $theme-light={{ bc: '$color12' }}
        disabledStyle={{ opacity: 0.5 }}
      >
        {isSubmitting ? (
          <Spinner color="$color1" />
        ) : (
          <Button.Text color="$color1" fontWeight="600">
            {t('check.claim.submit')}
          </Button.Text>
        )}
      </Button>
    </YStack>
  )
}

export default CheckClaimPreviewScreen
