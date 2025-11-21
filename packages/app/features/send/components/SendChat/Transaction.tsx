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

  return (
    <YStack bg="$color1" p="$4" py="$5" gap="$6">
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
      <Button circular onPress={onClose} cursor="pointer" pos="absolute" t={12} r={6}>
        <Button.Icon>
          <IconX size="$1.5" color="$gray11" />
        </Button.Icon>
      </Button>

      <YStack gap="$4">
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
    </YStack>
  )
}

export const Transaction = ({ open, onClose: onCloseProp, transaction }: TransactionProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null)

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [open])

  const { gtLg } = useMedia()

  const theme = useTheme()

  const { bottom, top } = useSafeAreaInsets()

  const onClose = () => {
    bottomSheetRef.current?.close()
    setTimeout(() => {
      onCloseProp()
    }, 200)
  }

  return (
    <Portal zIndex={200}>
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={[230]}
        enablePanDownToClose
        bottomInset={bottom}
        topInset={top}
        handleComponent={null}
        backgroundStyle={{
          borderRadius: 0,
          backgroundColor: theme.color1.val,
        }}
        containerStyle={
          gtLg
            ? {
                maxWidth: 698,
                margin: 47,
                marginLeft: 'auto',
                borderRadius: 20,
              }
            : undefined
        }
      >
        <BottomSheetView id="transaction-content">
          {transaction && <TransactionContent transaction={transaction} onClose={onClose} />}
        </BottomSheetView>
      </BottomSheet>
      <AnimatePresence>
        {open && (
          <View
            pe="auto"
            role="button"
            aria-label="Close transaction"
            animation="200ms"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            bg="$shadowColor"
            pos="absolute"
            inset={0}
            onPress={onClose}
            zi={-1}
          />
        )}
      </AnimatePresence>
    </Portal>
  )
}
