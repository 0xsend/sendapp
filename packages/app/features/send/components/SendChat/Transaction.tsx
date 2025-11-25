import {
  AnimatePresence,
  Portal,
  useSafeAreaInsets,
  View,
  XStack,
  YStack,
  Paragraph,
  Button,
  SizableText,
  useTheme,
  useMedia,
  Sheet,
} from '@my/ui'
import BottomSheet from '@gorhom/bottom-sheet'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { useEffect, useRef } from 'react'
import type { Activity } from 'app/utils/zod/activity'
import { ActivityAvatar } from 'app/features/activity/ActivityAvatar'
import { IconX } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { counterpart, userNameFromActivityUser, noteFromActivity } from 'app/utils/activity'
import { useAmountFromActivity } from 'app/utils/activity-hooks'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { useSendScreenParams } from 'app/routers/params'
import { formatUnits } from 'viem'
import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { allCoinsDict } from 'app/data/coins'
import { AlertCircle } from '@tamagui/lucide-icons'

interface TransactionProps {
  open: boolean
  onClose: () => void
  transaction: Activity | undefined
}

const TransactionContent = ({
  transaction,
  onClose,
}: { transaction: Activity; onClose: () => void }) => {
  const amount = useAmountFromActivity(transaction)
  const otherUser = counterpart(transaction)
  const isReceived = !!transaction.to_user?.id
  const username = otherUser ? userNameFromActivityUser(otherUser) : ''
  const note = noteFromActivity(transaction)
  const coinSymbol = transaction.data.coin?.symbol

  const amountText = typeof amount === 'string' ? amount : String(amount || '')
  const amountMatch = amountText.match(/^[+-]?\s*([\d,]+\.?\d*)\s*(\w+)?/)
  const numericAmount = amountMatch?.[1] || amountText
  const symbol = amountMatch?.[2] || coinSymbol || ''
  const [queryParams] = useSendScreenParams()
  const { sendToken, amount: amountParam } = queryParams

  const { bottom } = useSafeAreaInsets()

  const {
    query: { data: prices },
  } = useTokenPrices()

  const { coin: selectedCoin } = useCoinFromSendTokenParam()

  const price = prices?.[sendToken] ?? 0
  const amountInUSD =
    price *
    Number(
      formatUnits(
        BigInt(amountParam ?? ''),
        selectedCoin?.decimals ?? allCoinsDict[sendToken]?.decimals ?? 0
      )
    )

  const isFailed =
    transaction?.data?.status === 'failed' || transaction?.data?.status === 'cancelled'

  return (
    <YStack bg="$color1" p="$4" py="$5" gap="$6" pb={bottom}>
      {!isFailed && (
        <XStack ai="center" gap="$3" f={1}>
          <ActivityAvatar activity={transaction} size="$5" circular={true} />
          <YStack>
            <Paragraph size="$6" color="$color11">
              {username}
            </Paragraph>
            <XStack ai="center" gap="$2">
              <SizableText size="$4" col="$gray11">
                {isReceived ? 'Received on' : 'Sent on'}
              </SizableText>
              {transaction.created_at && (
                <SizableText size="$3" col="$gray9">
                  {transaction.created_at?.toLocaleString([], {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </SizableText>
              )}
            </XStack>
          </YStack>
        </XStack>
      )}
      <Button zi={100} circular onPress={onClose} cursor="pointer" pos="absolute" t={12} r={6}>
        <Button.Icon>
          <IconX size="$1.5" color="$gray11" />
        </Button.Icon>
      </Button>

      {!isFailed ? (
        <YStack pb="$4" gap="$4">
          <XStack ai="center" gap="$3">
            <SizableText size="$9" fontWeight="600" fontFamily="$mono" color="$color12">
              {numericAmount}
            </SizableText>
            <XStack gap="$2" ai="center">
              <SizableText size="$9" fow="600" fontFamily="$mono" col="$color12">
                {symbol}
              </SizableText>
              {symbol && <IconCoin scale={1} symbol={symbol} size="$2" />}
            </XStack>
            <SizableText color="$gray10" fontSize="$2" fontFamily="$mono" mt={-1}>
              {Number.isNaN(amountInUSD)
                ? null
                : `(${amountInUSD.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 2,
                  })})`}
            </SizableText>
          </XStack>

          {note && (
            <Paragraph boc="$aztec2" size="$4" color="$gray11">
              {decodeURIComponent(note)}
            </Paragraph>
          )}
        </YStack>
      ) : (
        <YStack ai="center" jc="center" gap="$4" h={150}>
          <AlertCircle opacity={0.8} size="$5" color="$yellow10" />
          <SizableText size="$8" color="$yellow11">
            Transaction failed
          </SizableText>
        </YStack>
      )}
    </YStack>
  )
}

export const Transaction = ({ open, onClose: onCloseProp, transaction }: TransactionProps) => {
  const onClose = () => {
    onCloseProp()
  }

  const transRef = useRef<Activity | undefined>(undefined)

  if (!transRef.current) {
    transRef.current = transaction
  }

  return (
    <Sheet
      open={open && !!transaction}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            onClose()
          }, 200)
        }
      }}
      forceRemoveScrollEnabled={open}
      modal
      snapPoints={[250]}
      snapPointsMode="constant"
      dismissOnSnapToBottom
      zIndex={100_000}
      animation="responsive"
    >
      <Sheet.Frame bg="$color1" id="transaction-content" maxWidth={720} m={35} ml="auto">
        {transRef.current && (
          <TransactionContent transaction={transRef.current} onClose={onCloseProp} />
        )}
      </Sheet.Frame>
      <Sheet.Overlay
        animation="100ms"
        bg="$shadowColor"
        enterStyle={{ o: 0 }}
        exitStyle={{ o: 0 }}
      />
    </Sheet>
  )
}
