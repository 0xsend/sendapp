import { Button, Card, Paragraph, Spinner, YStack } from '@my/ui'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { CheckPreviewCard, useCheckPreview } from './components/CheckPreviewCard'
import { useSetReferralCode } from 'app/utils/useReferralCode'

interface CheckPublicPreviewScreenProps {
  code: string
}

export function CheckPublicPreviewScreen({ code }: CheckPublicPreviewScreenProps) {
  const router = useRouter()
  const { t } = useTranslation('send')
  const { mutate: setReferralCode } = useSetReferralCode()

  // Use shared preview hook
  const { checkDetails, previewData, isLoading, error } = useCheckPreview(code || null)

  // Set the sender's sendtag as the referral code when preview loads
  useEffect(() => {
    if (previewData?.senderTag) {
      setReferralCode(previewData.senderTag)
    }
  }, [previewData?.senderTag, setReferralCode])

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
          </YStack>
        </Card>
      </YStack>
    )
  }

  // Build sign-up URL with redirect to claim preview after auth
  const encodedCode = encodeURIComponent(code)
  const redirectUri = encodeURIComponent(`/check/claim/preview?code=${encodedCode}`)

  return (
    <YStack f={1} gap="$5" w="100%" maxWidth={600}>
      <CheckPreviewCard checkCode={code} />

      {/* Auth Button */}
      <Button
        size="$5"
        onPress={() => router.push(`/auth/sign-up?redirectUri=${redirectUri}`)}
        bc="$primary"
        $theme-light={{ bc: '$color12' }}
      >
        <Button.Text color="$color1" fontWeight="600">
          {t('check.claim.public.claimButton')}
        </Button.Text>
      </Button>
    </YStack>
  )
}

export default CheckPublicPreviewScreen
