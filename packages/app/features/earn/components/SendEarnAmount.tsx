import { Paragraph, Spinner, TooltipSimple } from '@my/ui'
import { Bug } from '@tamagui/lucide-icons'
import { coinsDict } from 'app/data/coins'
import formatAmount from 'app/utils/formatAmount'
import { toNiceError } from 'app/utils/toNiceError'
import {
  isTemporalSendEarnDepositEvent,
  type SendEarnEvent,
} from 'app/utils/zod/activity/SendEarnEventSchema'
import type { ReactNode } from 'react'
import { formatUnits } from 'viem'
import { useUnderlyingVaultsAsset } from '../hooks'

export function SendEarnAmount({ activity }: { activity: SendEarnEvent }): ReactNode {
  // consider hoisting this higher and providing it as context to avoid so many network requests
  const assets = useUnderlyingVaultsAsset(
    isTemporalSendEarnDepositEvent(activity)
      ? activity.data.vault
        ? [activity.data.vault]
        : undefined
      : [activity.data.log_addr]
  )
  const asset = assets?.data?.[0]
  if (assets.isLoading) {
    return <Spinner size="small" color={'$color12'} />
  }
  if (assets.error) {
    console.error('error fetching underlying vaults asset', assets.error)
    return (
      <TooltipSimple label={toNiceError(assets.error)} placement="top">
        <Paragraph color="$error" size={'$5'}>
          &nbsp;
          <Bug size="1.5" />
        </Paragraph>
      </TooltipSimple>
    )
  }
  if (!asset) {
    // should never happen
    console.warn('asset not found for SendEarnAmount', activity)
    return null
  }
  const coin = coinsDict[asset]
  if (!coin) {
    // should never happen
    console.warn('coin not found for SendEarnAmount', activity)
    return null
  }
  if (!activity.data.assets) {
    // this can actually happen for temporal events, but should be rare
    return null
  }
  return `${formatAmount(
    formatUnits(activity.data.assets, coin.decimals),
    5,
    coin.formatDecimals
  )} ${coin.symbol}`
}
