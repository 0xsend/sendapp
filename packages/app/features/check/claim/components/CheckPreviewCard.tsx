import { Avatar, Card, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { Gift } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { useCheckDetails, parseCheckCode, type TokenAmount } from 'app/utils/useSendCheckClaim'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { formatUnits } from 'viem'
import { allCoinsDict } from 'app/data/coins'
import { encodeCheckCode } from 'app/utils/checkCode'

export interface TokenPreviewData {
  amount: string
  symbol: string
  coinIcon?: string
}

export interface CheckPreviewData {
  tokens: TokenPreviewData[]
  expiresAt: Date
  isExpired: boolean
  isClaimed: boolean
  senderTag?: string
  senderAvatar?: string
}

interface CheckPreviewCardProps {
  checkCode: string
}

export function useCheckPreview(checkCode: string | null) {
  // Fetch check details
  const {
    data: checkDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useCheckDetails(checkCode)

  // Look up sender's profile
  const senderAddress = checkDetails?.from ?? ''
  const { data: senderProfile, isLoading: isLoadingProfile } = useProfileLookup(
    'address',
    senderAddress
  )

  // Format the check code with dashes for display
  const formattedCode = useMemo(() => {
    if (!checkCode) return ''
    return encodeCheckCode(parseCheckCode(checkCode) ?? ('0x' as `0x${string}`))
  }, [checkCode])

  // Format check details for display
  const previewData = useMemo((): CheckPreviewData | null => {
    if (!checkDetails) return null

    const tokens: TokenPreviewData[] = checkDetails.tokenAmounts.map((ta) => {
      const coin = allCoinsDict[ta.token.toLowerCase()]
      const decimals = coin?.decimals ?? 18
      const symbol = coin?.symbol ?? 'tokens'
      const formattedAmount = formatUnits(ta.amount, decimals)
      const coinIcon = coin?.icon

      return {
        amount: formattedAmount,
        symbol,
        coinIcon,
      }
    })

    const expiresAt = new Date(Number(checkDetails.expiresAt) * 1000)

    return {
      tokens,
      expiresAt,
      isExpired: checkDetails.isExpired,
      isClaimed: checkDetails.isClaimed,
      senderTag: senderProfile?.tag,
      senderAvatar: senderProfile?.avatar_url,
    }
  }, [checkDetails, senderProfile])

  return {
    checkDetails,
    previewData,
    formattedCode,
    isLoading: isLoadingDetails,
    isLoadingProfile,
    error: detailsError,
  }
}

export function CheckPreviewCard({ checkCode }: CheckPreviewCardProps) {
  const { t } = useTranslation('send')
  const { previewData, isLoading, isLoadingProfile, error, checkDetails } =
    useCheckPreview(checkCode)

  // Loading state
  if (isLoading) {
    return (
      <Card padded elevation={1} br="$5">
        <YStack ai="center" gap="$4" py="$6">
          <Spinner size="large" />
          <Paragraph color="$color10">{t('check.claim.verifying')}</Paragraph>
        </YStack>
      </Card>
    )
  }

  // Error state
  if (error || !checkDetails || !previewData) {
    return (
      <Card padded elevation={1} br="$5">
        <YStack ai="center" gap="$4" py="$4">
          <Paragraph color="$error" size="$5" fontWeight="600">
            {t('check.claim.notFound')}
          </Paragraph>
        </YStack>
      </Card>
    )
  }

  return (
    <Card padded elevation={1} br="$5">
      <YStack ai="center" gap="$5" py="$4">
        {/* Sender info */}
        <YStack ai="center" gap="$2">
          {isLoadingProfile ? (
            <Spinner size="small" />
          ) : (
            <>
              {previewData.senderAvatar ? (
                <Avatar size="$6" circular>
                  <Avatar.Image src={previewData.senderAvatar} />
                  <Avatar.Fallback bc="$color5" />
                </Avatar>
              ) : (
                <XStack w="$6" h="$6" br="$10" ai="center" jc="center" bc="$color3">
                  <Gift size="$2" color="$color10" />
                </XStack>
              )}
              <Paragraph color="$color10" size="$3">
                {previewData.senderTag
                  ? `@${previewData.senderTag}`
                  : t('check.claim.preview.someone')}{' '}
                {t('check.claim.preview.sentYou')}
              </Paragraph>
            </>
          )}
        </YStack>

        {/* Token amounts */}
        <YStack ai="center" gap="$3">
          {previewData.tokens.map((token) => (
            <YStack key={token.symbol} ai="center" gap="$1">
              <Paragraph color="$color12" fontWeight="700" fontSize="$9">
                {token.amount}
              </Paragraph>
              <Paragraph color="$color10" fontSize="$5" fontWeight="500">
                {token.symbol}
              </Paragraph>
            </YStack>
          ))}
        </YStack>

        {/* Expiration */}
        <Paragraph color="$color10" size="$3">
          {t('check.claim.preview.expires')} {previewData.expiresAt.toLocaleDateString()}
        </Paragraph>

        {/* Status warnings */}
        {previewData.isClaimed && (
          <Paragraph color="$orange10" size="$3" fontWeight="600">
            {t('check.claim.alreadyClaimed')}
          </Paragraph>
        )}
        {previewData.isExpired && !previewData.isClaimed && (
          <Paragraph color="$error" size="$3" fontWeight="600">
            {t('check.claim.expired')}
          </Paragraph>
        )}
      </YStack>
    </Card>
  )
}

export default CheckPreviewCard
