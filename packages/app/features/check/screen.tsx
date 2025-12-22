import {
  Avatar,
  H4,
  Paragraph,
  PrimaryButton,
  Shimmer,
  Spinner,
  Text,
  useAppToast,
  View,
  XStack,
  YStack,
} from '@my/ui'
import { ArrowDown, ArrowUp, Clock, Plus, XCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useState, useCallback, useMemo, memo } from 'react'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserSendChecks, useSendCheckRevoke, type Check } from 'app/utils/useSendCheck'
import { formatUnits, checksumAddress } from 'viem'
import formatAmount from 'app/utils/formatAmount'
import { allCoinsDict, type coin } from 'app/data/coins'
import { FlashList } from '@shopify/flash-list'
import { IconCoin } from 'app/components/icons'
import { byteaToHex } from 'app/utils/byteaToHex'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { ActivityRowLayout } from 'app/components/ActivityRowLayout'
import type { PgBytea } from '@my/supabase/database.types'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import debug from 'debug'

const log = debug('app:features:check')

// Activity-style row height (matches RecentActivityFeed)
const ROW_HEIGHT = 122

export function CheckScreen() {
  const router = useRouter()
  const { t } = useTranslation('send')

  return (
    <YStack
      f={1}
      width={'100%'}
      maxWidth={600}
      pb="$3"
      pt="$3"
      gap="$6"
      $gtLg={{ pt: 0, gap: '$7' }}
    >
      <YStack f={1}>
        <ChecksList />
      </YStack>
      <PrimaryButton onPress={() => router.push('/check/send')}>
        <PrimaryButton.Icon>
          <Plus size={16} color="$black" />
        </PrimaryButton.Icon>
        <PrimaryButton.Text>{t('check.button')}</PrimaryButton.Text>
      </PrimaryButton>
    </YStack>
  )
}

type ListItem =
  | (Check & { sectionIndex: number })
  | { type: 'header'; title: string; sectionIndex: number }

function getDateLabel(date: Date, t: (key: string) => string): string {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return t('check.sections.today')

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return t('check.sections.yesterday')

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
}

function ChecksList() {
  const { t } = useTranslation('send')
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserSendChecks()

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage])

  const { flattenedData, sectionDataMap } = useMemo(() => {
    if (!data?.pages) return { flattenedData: [], sectionDataMap: new Map() }

    const checks = data.pages.flat()

    // Group checks: active/expired-unclaimed go to "Pending", others by sent date
    const groups: Record<string, Check[]> = {}

    for (const check of checks) {
      let groupKey: string
      if (check.is_active || (check.is_expired && !check.is_claimed)) {
        // Active or expired unclaimed - group as "Pending"
        groupKey = t('check.sections.pending')
      } else {
        // Claimed checks - group by sent date
        const sentDate = new Date(Number(check.block_time) * 1000)
        groupKey = getDateLabel(sentDate, t)
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey]?.push(check)
    }

    // Build flattened list with headers
    const result: ListItem[] = []
    const sectionMap = new Map<number, { firstIndex: number; lastIndex: number }>()

    // Ensure "Pending" section comes first if it exists
    const pendingKey = t('check.sections.pending')
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === pendingKey) return -1
      if (b === pendingKey) return 1
      return 0 // Keep other order as-is (already sorted by date from query)
    })

    sortedKeys.forEach((title, sectionIndex) => {
      const sectionData = groups[title]
      if (!sectionData) return

      // Add header
      result.push({ type: 'header', title, sectionIndex })
      const firstIndex = result.length

      // Add items
      result.push(...sectionData.map((check) => ({ ...check, sectionIndex })))

      sectionMap.set(sectionIndex, { firstIndex, lastIndex: result.length - 1 })
    })

    return { flattenedData: result, sectionDataMap: sectionMap }
  }, [data?.pages, t])

  const getItemType = useCallback((item: ListItem) => {
    return 'type' in item && item.type === 'header' ? 'header' : 'check'
  }, [])

  const keyExtractor = useCallback((item: ListItem) => {
    if ('type' in item && item.type === 'header') {
      return `header-${item.sectionIndex}-${item.title}`
    }
    const check = item as Check & { sectionIndex: number }
    return `${check.ephemeral_address}-${check.chain_id}`
  }, [])

  const renderItem = useCallback(
    ({ item, index }: { item: ListItem; index: number }) => {
      if ('type' in item && item.type === 'header') {
        return <SectionHeader title={item.title} />
      }

      const check = item as Check & { sectionIndex: number }
      const sectionInfo = sectionDataMap.get(check.sectionIndex)
      const isFirst = sectionInfo?.firstIndex === index
      const isLast = sectionInfo?.lastIndex === index

      return <CheckCard check={check} isFirst={isFirst} isLast={isLast} />
    },
    [sectionDataMap]
  )

  if (isLoading) {
    return (
      <YStack ai="center" jc="center" gap="$2" py="$4">
        <Spinner size="small" />
        <Paragraph color="$color10" size="$3">
          {t('check.manage.loading')}
        </Paragraph>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack ai="center" jc="center" gap="$2" py="$4">
        <XCircle size="$1.5" color="$error" />
        <Paragraph color="$error" size="$3">
          {t('check.manage.error')}
        </Paragraph>
      </YStack>
    )
  }

  if (flattenedData.length === 0) {
    return (
      <Paragraph color="$color10" size="$3" py="$4">
        {t('check.manage.noActiveChecks')}
      </Paragraph>
    )
  }

  return (
    <View className="hide-scroll" display="contents">
      <FlashList
        data={flattenedData}
        style={styles.flashListStyle}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemType={getItemType}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasNextPage ? <ListFooterComponent /> : null}
      />
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View h={56} w="100%">
      <H4 size="$7" fontWeight="400" py="$3.5" bc="$background" col="$gray11">
        {title}
      </H4>
    </View>
  )
}

/**
 * Parse tokens and amounts into display items
 * Note: amounts come from Postgres as strings (numeric type) to preserve precision
 */
function useTokenItems(tokens: string[], amounts: (string | number)[]) {
  return useMemo(() => {
    const items: { coin: coin | undefined; formatted: string }[] = []
    for (let i = 0; i < tokens.length; i++) {
      const rawToken = tokens[i]
      if (!rawToken) continue
      const tokenAddress = checksumAddress(byteaToHex(rawToken as PgBytea))
      const tokenCoin = allCoinsDict[tokenAddress as keyof typeof allCoinsDict]
      const decimals = tokenCoin?.decimals ?? 18
      const rawAmount = amounts[i]
      const amount = rawAmount ? BigInt(rawAmount.toString()) : 0n
      const formatted = formatUnits(amount, decimals)
      items.push({ coin: tokenCoin, formatted })
    }
    return items
  }, [tokens, amounts])
}

/**
 * Avatar-style icon for the check
 * Shows other party's profile picture if available, otherwise shows token icon
 * Arrow indicator shows ArrowUp (sent) for sender, ArrowDown (received) for receiver
 */
function CheckAvatar({
  tokens,
  isReceiver,
  avatarUrl,
}: {
  tokens: string[]
  isReceiver: boolean
  avatarUrl?: string | null
}) {
  const firstToken = tokens[0]
  const tokenAddress = firstToken ? checksumAddress(byteaToHex(firstToken as PgBytea)) : null
  const tokenCoin = tokenAddress ? allCoinsDict[tokenAddress as keyof typeof allCoinsDict] : null
  const Icon = isReceiver ? ArrowDown : ArrowUp

  // Determine what to show as the main avatar
  const renderMainAvatar = () => {
    if (avatarUrl) {
      return (
        <Avatar size="$5" circular>
          <Avatar.Image src={avatarUrl} />
          <Avatar.Fallback bc="$color3">
            {tokenCoin ? (
              <IconCoin symbol={tokenCoin.symbol} size="$5" />
            ) : (
              <Clock size="$2" color="$color10" />
            )}
          </Avatar.Fallback>
        </Avatar>
      )
    }

    if (tokenCoin) {
      return <IconCoin symbol={tokenCoin.symbol} size="$5" />
    }

    return (
      <XStack w="$5" h="$5" br="$4" bc="$color3" ai="center" jc="center">
        <Clock size="$2" color="$color10" />
      </XStack>
    )
  }

  return (
    <XStack w="$5" h="$5" br="$4" ai="center" jc="center" position="relative">
      {renderMainAvatar()}
      {/* Arrow indicator */}
      <XStack
        position="absolute"
        bottom={0}
        right={0}
        transform="translate(5px, 5px) scale(0.85)"
        bc={isReceiver ? '$olive' : '$error'}
        borderRadius={999}
        borderWidth={2}
        borderColor="$color1"
        zi={10}
      >
        <Icon size="$1" color="$white" />
      </XStack>
    </XStack>
  )
}

/**
 * Format relative time for display
 */
function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

interface CheckCardProps {
  check: Check
  isFirst: boolean
  isLast: boolean
}

const CheckCard = memo(function CheckCard({ check, isFirst, isLast }: CheckCardProps) {
  const { t } = useTranslation('send')
  const toast = useAppToast()
  const hoverStyles = useHoverStyles()
  const { data: sendAccount } = useSendAccount()
  const [isConfirming, setIsConfirming] = useState(false)

  // Determine if user is the sender or receiver
  const isSender = check.is_sender ?? true

  // Look up the other party's profile
  const otherPartyAddress = useMemo(() => {
    if (isSender) {
      // Sender view: look up claimer's profile if check was claimed
      if (check.is_claimed && !check.is_canceled && check.claimed_by) {
        return byteaToHex(check.claimed_by as PgBytea)
      }
    } else {
      // Receiver view: look up sender's profile
      if (check.sender) {
        return byteaToHex(check.sender as PgBytea)
      }
    }
    return ''
  }, [isSender, check.is_claimed, check.is_canceled, check.claimed_by, check.sender])

  const { data: otherPartyProfile } = useProfileLookup('address', otherPartyAddress)

  // Only prepare revoke for active checks that can be canceled
  const ephemeralAddress = useMemo(
    () => (check.is_active ? byteaToHex(check.ephemeral_address as PgBytea) : undefined),
    [check.is_active, check.ephemeral_address]
  )

  const {
    revokeCheck,
    isPending: isRevoking,
    isPreparing,
    isReady,
    usdcFees,
  } = useSendCheckRevoke({
    ephemeralAddress,
  })

  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        ?.map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )

  const tokenItems = useTokenItems(check.tokens ?? [], check.amounts ?? [])
  const expiresAt = new Date(Number(check.expires_at) * 1000)
  const createdAt = new Date(Number(check.block_time) * 1000)

  const handleRevoke = useCallback(async () => {
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }

    try {
      await revokeCheck({ webauthnCreds })
      toast.show(t('check.manage.cancelSuccess'))
    } catch (error) {
      log('Failed to cancel check:', error)
      toast.error(error instanceof Error ? error.message : t('check.manage.cancelError'))
    } finally {
      setIsConfirming(false)
    }
  }, [isConfirming, revokeCheck, webauthnCreds, toast, t])

  const handleCancelConfirm = useCallback(() => {
    setIsConfirming(false)
  }, [])

  // Format amount text (e.g., "100 USDC" or "100 USDC + 50 SEND")
  const amountText = tokenItems
    .map((item) => `${item.formatted} ${item.coin?.symbol ?? 'tokens'}`)
    .join(' + ')

  // Title text based on status and whether user is sender or receiver
  const getTitleText = () => {
    if (isSender) {
      // Sender's perspective
      if (check.is_canceled) return t('check.manage.canceled')
      if (check.is_expired && !check.is_claimed) return t('check.manage.expired')
      return t('check.manage.sentCheck')
    }
    // Receiver's perspective - always show "Claimed Check"
    return t('check.manage.claimed')
  }

  // Subtext showing the other party
  const getOtherPartyText = () => {
    if (isSender) {
      // Sender view: show who claimed it
      if (!check.is_claimed || check.is_canceled) return null
      if (otherPartyProfile?.tag) {
        return `${t('check.manage.claimedBy')} /${otherPartyProfile.tag}`
      }
      return t('check.manage.claimedByUser')
    }
    // Receiver view: show who sent it
    if (otherPartyProfile?.tag) {
      return `${t('check.manage.from')} /${otherPartyProfile.tag}`
    }
    return t('check.manage.fromUser')
  }

  // Date text based on status
  const getDateText = () => {
    if (isSender) {
      // Sender's view
      if (check.is_active) {
        return `${t('check.manage.expiresAt')} ${expiresAt.toLocaleDateString()}`
      }
      if (check.is_canceled) {
        return t('check.manage.canceled')
      }
      if (check.is_claimed && check.claimed_at) {
        const otherPartyText = getOtherPartyText()
        if (otherPartyText) return otherPartyText
      }
      if (check.is_expired && !check.is_claimed) {
        return t('check.manage.expiredUnclaimed')
      }
    } else {
      // Receiver's view: show who it's from
      const otherPartyText = getOtherPartyText()
      if (otherPartyText) return otherPartyText
    }
    return formatRelativeDate(createdAt)
  }

  // Calculate total fee for display
  const totalFee = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : undefined
  const feeDecimals = usdcFees?.decimals ?? 6

  const cancelActions = check.is_active ? (
    isConfirming ? (
      <YStack gap="$2" ai="flex-end">
        <XStack gap="$2" ai="center">
          <Text fontSize="$3" color="$color10">
            {t('check.fee')}:
          </Text>
          {isPreparing ? (
            <Spinner size="small" />
          ) : totalFee !== undefined ? (
            <Text fontSize="$3" color="$color12" fontFamily="$mono">
              {formatAmount(formatUnits(totalFee, feeDecimals))} USDC
            </Text>
          ) : (
            <Text fontSize="$3" color="$color10">
              -
            </Text>
          )}
        </XStack>
        <XStack gap="$3" ai="center">
          {!isRevoking && (
            <Text
              fontSize="$3"
              color="$color10"
              cursor="pointer"
              onPress={handleCancelConfirm}
              hoverStyle={{ opacity: 0.7 }}
            >
              {t('check.manage.keepCheck')}
            </Text>
          )}
          {isRevoking ? (
            <Spinner size="small" color="$error" />
          ) : totalFee !== undefined ? (
            <Text
              fontSize="$3"
              color="$error"
              cursor="pointer"
              onPress={handleRevoke}
              disabled={!isReady || webauthnCreds.length === 0}
              hoverStyle={{ opacity: 0.7 }}
            >
              {t('check.manage.confirmCancel')}
            </Text>
          ) : null}
        </XStack>
      </YStack>
    ) : (
      <Text
        fontSize="$3"
        color="$color10"
        cursor="pointer"
        onPress={handleRevoke}
        disabled={webauthnCreds.length === 0}
        hoverStyle={{ opacity: 0.7 }}
      >
        {t('check.manage.cancelCheck')}
      </Text>
    )
  ) : null

  return (
    <YStack
      bc="$color1"
      p={10}
      h={ROW_HEIGHT}
      mah={ROW_HEIGHT}
      {...(isFirst && {
        borderTopLeftRadius: '$4',
        borderTopRightRadius: '$4',
      })}
      {...(isLast && {
        borderBottomLeftRadius: '$4',
        borderBottomRightRadius: '$4',
      })}
    >
      <ActivityRowLayout
        avatar={
          <CheckAvatar
            tokens={check.tokens ?? []}
            isReceiver={!isSender || check.is_canceled}
            avatarUrl={otherPartyProfile?.avatar_url}
          />
        }
        title={getTitleText()}
        amount={amountText}
        date={getDateText()}
        actions={cancelActions}
        hoverStyle={hoverStyles}
      />
    </YStack>
  )
})

const styles = {
  flashListStyle: {
    flex: 1,
  },
} as const

function ListFooterComponent() {
  return (
    <Shimmer
      br={10}
      mt={10}
      componentName="Card"
      $theme-light={{ bg: '$background' }}
      w="100%"
      h={ROW_HEIGHT}
    />
  )
}

export default CheckScreen
