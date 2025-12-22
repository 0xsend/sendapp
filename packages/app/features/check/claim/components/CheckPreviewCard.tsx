import { Avatar, Card, Paragraph, Spinner, XStack, YStack, useThemeName } from '@my/ui'
import { Gift } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { IconBadgeCheckSolid2 } from 'app/components/icons'
import { useCheckDetails } from 'app/utils/useSendCheckClaim'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { allCoins, type coin } from 'app/data/coins'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { IconCoin } from 'app/components/icons/IconCoin'

export interface TokenPreviewData {
  amount: string
  symbol: coin['symbol']
  coin: coin
}

export interface CheckPreviewData {
  tokens: TokenPreviewData[]
  expiresAt: Date
  isExpired: boolean
  isClaimed: boolean
  isCanceled: boolean
  senderTag?: string
  senderAvatar?: string
  senderIsVerified?: boolean
}

interface CheckPreviewCardProps {
  checkCode: string
  children?: React.ReactNode
}

export function useCheckPreview(checkCode: string | null) {
  // Fetch check details (chain is encoded in the checkCode)
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

  // Format check details for display
  const previewData = useMemo((): CheckPreviewData | null => {
    if (!checkDetails) return null

    const tokens: TokenPreviewData[] = checkDetails.tokenAmounts
      .map((ta) => {
        const coin = allCoins.find((c) => c.token.toLowerCase() === ta.token.toLowerCase())
        if (!coin) return null

        return {
          amount: formatCoinAmount({ amount: ta.amount, coin }),
          symbol: coin.symbol,
          coin,
        }
      })
      .filter((t): t is TokenPreviewData => t !== null)

    const expiresAt = new Date(Number(checkDetails.expiresAt) * 1000)

    return {
      tokens,
      expiresAt,
      isExpired: checkDetails.isExpired,
      isClaimed: checkDetails.isClaimed,
      isCanceled: checkDetails.isCanceled,
      senderTag: senderProfile?.tag ?? undefined,
      senderAvatar: senderProfile?.avatar_url ?? undefined,
      senderIsVerified: senderProfile?.is_verified ?? false,
    }
  }, [checkDetails, senderProfile])

  return {
    checkDetails,
    previewData,
    isLoading: isLoadingDetails,
    isLoadingProfile,
    error: detailsError,
  }
}

export function CheckPreviewCard({ checkCode, children }: CheckPreviewCardProps) {
  const { t } = useTranslation('send')
  const theme = useThemeName()
  const isDark = theme.includes('dark')
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
          <Paragraph color="$color10" size="$4" ta="center">
            {t('check.claim.notFoundMessage')}
          </Paragraph>
        </YStack>
      </Card>
    )
  }

  // TODO: Remove mock data after testing
  const mockAvatar = 'https://i.pravatar.cc/150?img=3'
  const forceVerified = true

  return (
    <Card padded elevation={1} br="$5">
      <YStack ai="center" gap="$5" py="$4">
        {/* Sender info */}
        <YStack ai="center" gap="$2">
          {isLoadingProfile ? (
            <Spinner size="small" />
          ) : (
            <>
              <XStack position="relative">
                {previewData.senderAvatar || mockAvatar ? (
                  <Avatar size="$6" circular>
                    <Avatar.Image src={previewData.senderAvatar || mockAvatar} />
                    <Avatar.Fallback bc="$color5" />
                  </Avatar>
                ) : (
                  <XStack w="$6" h="$6" br="$10" ai="center" jc="center" bc="$color3">
                    <Gift size="$2" color="$color10" />
                  </XStack>
                )}
                {(previewData.senderIsVerified || forceVerified) && (
                  <XStack zi={100} pos="absolute" bottom={2} right={2}>
                    <XStack pos="absolute" elevation={'$1'} scale={0.5} br={1000} inset={0} />
                    <IconBadgeCheckSolid2
                      size="$1"
                      scale={0.9}
                      color="$neon8"
                      $theme-dark={{ color: '$neon7' }}
                      // @ts-expect-error - checkColor is not typed
                      checkColor={isDark ? '#082B1B' : '#fff'}
                    />
                  </XStack>
                )}
              </XStack>
              <Paragraph color="$color10" size="$3">
                {previewData.senderTag
                  ? `/${previewData.senderTag}`
                  : t('check.claim.preview.someone')}{' '}
                {t('check.claim.preview.sentYou')}
              </Paragraph>
            </>
          )}
        </YStack>

        {/* Token amounts */}
        <YStack ai="center" gap="$4">
          {previewData.tokens.map((token) => (
            <XStack key={token.symbol} ai="center" gap="$2">
              <IconCoin symbol={token.symbol} size="$2" />
              <Paragraph color="$color12" fontWeight="700" fontSize="$9" lineHeight="$9">
                {token.amount} {token.symbol}
              </Paragraph>
            </XStack>
          ))}
        </YStack>

        {/* Expiration */}
        <Paragraph color="$color10" size="$3">
          {t('check.claim.preview.expires')} {previewData.expiresAt.toLocaleDateString()}
        </Paragraph>

        {/* Status warnings */}
        {previewData.isCanceled && (
          <Paragraph color="$orange10" size="$3" fontWeight="600">
            {t('check.claim.canceled')}
          </Paragraph>
        )}
        {previewData.isClaimed && !previewData.isCanceled && (
          <Paragraph color="$orange10" size="$3" fontWeight="600">
            {t('check.claim.alreadyClaimed')}
          </Paragraph>
        )}
        {previewData.isExpired && !previewData.isClaimed && (
          <Paragraph color="$error" size="$3" fontWeight="600">
            {t('check.claim.expired')}
          </Paragraph>
        )}

        {children}
      </YStack>
    </Card>
  )
}

export default CheckPreviewCard
