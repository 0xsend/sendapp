import {
  Paragraph,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
  H4,
  Button,
  FadeCard,
  AnimatePresence,
} from '@my/ui'
import { useBridgeDeposits } from 'app/features/bank-transfer'
import { useCallback, useMemo, memo, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { ActivityRowLayout } from 'app/components/ActivityRowLayout'
import { Check, Clock, XCircle, HelpCircle } from '@tamagui/lucide-icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import type { Tables } from '@my/supabase/database.types'

const ROW_HEIGHT = 122
const PENDING_STATUSES = new Set([
  'awaiting_funds',
  'funds_received',
  'funds_scheduled',
  'in_review',
  'payment_submitted',
])
const ERROR_STATUSES = new Set([
  'undeliverable',
  'returned',
  'missing_return_policy',
  'refunded',
  'canceled',
  'error',
  'refund',
])

type BridgeDeposit = Tables<'bridge_deposits'>
type ListItem =
  | (BridgeDeposit & { sectionIndex: number })
  | { type: 'header'; title: string; sectionIndex: number }

function formatAmount(amount: number | null, currency: string | null) {
  const value = typeof amount === 'number' ? amount : 0
  const code = (currency ?? 'usd').toUpperCase()
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return code === 'USD' ? `$${formatted}` : `${formatted} ${code}`
}

function formatPaymentRail(rail?: string | null) {
  if (!rail) return 'Bank transfer'
  return rail === 'ach_push' ? 'ACH transfer' : 'Wire transfer'
}

function formatStatus(status?: string | null) {
  switch (status) {
    case 'awaiting_funds':
      return 'Awaiting funds'
    case 'funds_received':
      return 'Funds received'
    case 'funds_scheduled':
      return 'Funds scheduled'
    case 'in_review':
      return 'In review'
    case 'payment_submitted':
      return 'Payment submitted'
    case 'payment_processed':
      return 'Completed'
    case 'undeliverable':
      return 'Undeliverable'
    case 'returned':
      return 'Returned'
    case 'missing_return_policy':
      return 'Missing return policy'
    case 'refunded':
      return 'Refunded'
    case 'canceled':
      return 'Canceled'
    case 'error':
      return 'Error'
    case 'refund':
      return 'Refunded'
    default:
      return 'Processing'
  }
}

function getDateLabel(date: Date): string {
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
}

function getStatusTone(status?: string | null): 'pending' | 'success' | 'error' {
  if (status === 'payment_processed') return 'success'
  if (ERROR_STATUSES.has(status ?? '')) return 'error'
  return 'pending'
}

function TransferAvatar({ status }: { status?: string | null }) {
  const tone = getStatusTone(status)
  const Icon = tone === 'success' ? Check : tone === 'error' ? XCircle : Clock
  const background = tone === 'success' ? '$olive' : tone === 'error' ? '$error' : '$olive'
  const iconColor = '$white'

  return (
    <XStack w="$5" h="$5" br="$4" bc={background} ai="center" jc="center">
      <Icon size="$1" color={iconColor} />
    </XStack>
  )
}

function SectionHeader({
  title,
  onInfoPress,
}: {
  title: string
  onInfoPress?: () => void
}) {
  const showInfoButton = title === 'Pending' && onInfoPress
  return (
    <View h={56} w="100%">
      <XStack ai="center" jc="space-between" py="$3.5">
        <H4 size="$7" fontWeight="400" bc="$background" col="$gray11">
          {title}
        </H4>
        {showInfoButton && (
          <Button
            size="$2"
            circular
            animation="100ms"
            animateOnly={['transform']}
            boc="$aztec3"
            hoverStyle={{ boc: '$aztec4' }}
            pressStyle={{ boc: '$aztec4', scale: 0.9 }}
            onPress={onInfoPress}
          >
            <Button.Icon scaleIcon={1.2}>
              <HelpCircle size={14} />
            </Button.Icon>
          </Button>
        )}
      </XStack>
    </View>
  )
}

function PendingInfoCard({ onDismiss }: { onDismiss: () => void }) {
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
          Pending Transfer Status
        </Paragraph>

        <Paragraph
          fontSize="$4"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Bank transfers go through several stages before completing. Here's what each status means:
        </Paragraph>

        <YStack gap="$3" py="$2">
          <YStack gap="$1">
            <Paragraph fontSize="$4" fontWeight={600}>
              Awaiting funds
            </Paragraph>
            <Paragraph
              fontSize="$3"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              We're waiting to receive your transfer from your bank.
            </Paragraph>
          </YStack>

          <YStack gap="$1">
            <Paragraph fontSize="$4" fontWeight={600}>
              Funds received
            </Paragraph>
            <Paragraph
              fontSize="$3"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Your transfer has arrived and is being processed.
            </Paragraph>
          </YStack>

          <YStack gap="$1">
            <Paragraph fontSize="$4" fontWeight={600}>
              Funds scheduled
            </Paragraph>
            <Paragraph
              fontSize="$3"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Your deposit is scheduled to be credited to your account.
            </Paragraph>
          </YStack>

          <YStack gap="$1">
            <Paragraph fontSize="$4" fontWeight={600}>
              In review
            </Paragraph>
            <Paragraph
              fontSize="$3"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Your transfer is being reviewed. This is a routine check.
            </Paragraph>
          </YStack>

          <YStack gap="$1">
            <Paragraph fontSize="$4" fontWeight={600}>
              Payment submitted
            </Paragraph>
            <Paragraph
              fontSize="$3"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Your USDC is being sent to your wallet and will arrive shortly.
            </Paragraph>
          </YStack>
        </YStack>

        <Paragraph
          fontSize="$3"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          ACH transfers typically take 1-3 business days. Wire transfers are usually same-day.
        </Paragraph>

        <Button size="$4" theme="green" onPress={onDismiss} mt="$2">
          Got it
        </Button>
      </YStack>
    </FadeCard>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const TransferRow = memo(function TransferRow({
  deposit,
  isFirst,
  isLast,
  isPending,
}: {
  deposit: BridgeDeposit
  isFirst: boolean
  isLast: boolean
  isPending: boolean
}) {
  const hoverStyles = useHoverStyles()
  const title = formatStatus(deposit.status)
  const amount = formatAmount(deposit.amount, deposit.currency)
  const rail = formatPaymentRail(deposit.payment_rail)
  const date = formatDate(deposit.created_at)
  const subtext = isPending ? `${rail} · ${date}` : rail
  const trace = deposit.trace_number ? `Trace: ${deposit.trace_number}` : null

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
        avatar={<TransferAvatar status={deposit.status} />}
        title={title}
        amount={amount}
        subtext={subtext}
        subtext2={trace ? <Text>{trace}</Text> : null}
        hoverStyle={hoverStyles}
      />
    </YStack>
  )
})

export function BankTransferHistoryScreen() {
  const { data: deposits, isLoading, error } = useBridgeDeposits()
  const [showPendingInfo, setShowPendingInfo] = useState(false)

  const rows = useMemo(() => deposits ?? [], [deposits])
  const { flattenedData, sectionDataMap } = useMemo(() => {
    if (!rows.length) return { flattenedData: [], sectionDataMap: new Map() }

    const groups: Record<string, BridgeDeposit[]> = {}
    const sectionOrder: string[] = []

    for (const deposit of rows) {
      const createdAt = new Date(deposit.created_at)
      const isPending = PENDING_STATUSES.has(deposit.status ?? '')
      const key = isPending ? 'Pending' : getDateLabel(createdAt)

      if (!groups[key]) {
        groups[key] = []
        sectionOrder.push(key)
      }

      groups[key]?.push(deposit)
    }

    const pendingKey = 'Pending'
    const orderedKeys = sectionOrder.filter((key) => key !== pendingKey)
    if (groups[pendingKey]) {
      orderedKeys.unshift(pendingKey)
    }

    const result: ListItem[] = []
    const sectionMap = new Map<number, { firstIndex: number; lastIndex: number }>()

    orderedKeys.forEach((title, sectionIndex) => {
      const sectionData = groups[title]
      if (!sectionData) return

      result.push({ type: 'header', title, sectionIndex })
      const firstIndex = result.length

      result.push(...sectionData.map((deposit) => ({ ...deposit, sectionIndex })))

      sectionMap.set(sectionIndex, { firstIndex, lastIndex: result.length - 1 })
    })

    return { flattenedData: result, sectionDataMap: sectionMap }
  }, [rows])

  const getItemType = useCallback((item: ListItem) => {
    return 'type' in item && item.type === 'header' ? 'header' : 'transfer'
  }, [])

  const keyExtractor = useCallback((item: ListItem) => {
    if ('type' in item && item.type === 'header') {
      return `header-${item.sectionIndex}-${item.title}`
    }
    const deposit = item as BridgeDeposit & { sectionIndex: number }
    return `deposit-${deposit.id}`
  }, [])

  const handlePendingInfoPress = useCallback(() => setShowPendingInfo(true), [])

  const renderItem = useCallback(
    ({ item, index }: { item: ListItem; index: number }) => {
      if ('type' in item && item.type === 'header') {
        return <SectionHeader title={item.title} onInfoPress={handlePendingInfoPress} />
      }

      const deposit = item as BridgeDeposit & { sectionIndex: number }
      const sectionInfo = sectionDataMap.get(deposit.sectionIndex)
      const isFirst = sectionInfo?.firstIndex === index
      const isLast = sectionInfo?.lastIndex === index
      const isPending = PENDING_STATUSES.has(deposit.status ?? '')

      return (
        <TransferRow deposit={deposit} isFirst={isFirst} isLast={isLast} isPending={isPending} />
      )
    },
    [sectionDataMap, handlePendingInfoPress]
  )

  if (isLoading) {
    return (
      <YStack f={1} ai="center" jc="center" py="$8">
        <Spinner size="large" color="$primary" />
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack width="100%" maxWidth={600} gap="$5" $gtLg={{ pb: '$3.5' }}>
        <Paragraph color="$error">Failed to load transfer history.</Paragraph>
      </YStack>
    )
  }

  if (!rows.length) {
    return (
      <YStack width="100%" maxWidth={600} gap="$5" $gtLg={{ pb: '$3.5' }}>
        <Paragraph color="$color10">No bank transfers yet.</Paragraph>
      </YStack>
    )
  }

  return (
    <YStack f={1} width="100%" maxWidth={600} pb="$3" pt="$3" gap="$6" $gtLg={{ pt: 0 }}>
      <AnimatePresence exitBeforeEnter>
        {showPendingInfo ? (
          <PendingInfoCard key="pending-info" onDismiss={() => setShowPendingInfo(false)} />
        ) : (
          <View key="list" className="hide-scroll" display="contents" f={1}>
            <FlashList
              data={flattenedData}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              getItemType={getItemType}
              style={styles.flashListStyle}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </AnimatePresence>
    </YStack>
  )
}

const styles = {
  flashListStyle: {
    flex: 1,
  },
} as const
