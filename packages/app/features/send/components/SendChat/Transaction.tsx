import {
  AnimatePresence,
  Portal,
  useSafeAreaInsets,
  View,
  XStack,
  YStack,
  Paragraph,
  Stack,
} from '@my/ui'
import BottomSheet from '@gorhom/bottom-sheet'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { useEffect, useRef } from 'react'
import type { Activity } from 'app/utils/zod/activity'
import { ActivityAvatar } from 'app/features/activity/ActivityAvatar'
import { IconX } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import {
  counterpart,
  userNameFromActivityUser,
  noteFromActivity,
  useDateDetailsFromActivity,
} from 'app/utils/activity'
import { useAmountFromActivity } from 'app/utils/activity-hooks'

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
  const date = useDateDetailsFromActivity({ activity: transaction })
  const otherUser = counterpart(transaction)
  const isReceived = !!transaction.to_user?.id
  const username = otherUser ? userNameFromActivityUser(otherUser) : ''
  const note = noteFromActivity(transaction)
  const coinSymbol = transaction.data.coin?.symbol

  const amountText = typeof amount === 'string' ? amount : String(amount || '')
  const amountMatch = amountText.match(/^[+-]?\s*([\d,]+\.?\d*)\s*(\w+)?/)
  const numericAmount = amountMatch?.[1] || amountText
  const symbol = amountMatch?.[2] || coinSymbol || ''

  return (
    <YStack bg="$color1" br="$6" p="$4" gap="$4" m="$4">
      <XStack ai="center" jc="space-between">
        <XStack ai="center" gap="$3" f={1}>
          <ActivityAvatar activity={transaction} size="$5" circular={true} />
          <Paragraph size="$5" color="$color11">
            {username} {isReceived ? 'received' : 'sent'}
          </Paragraph>
        </XStack>
        <Stack onPress={onClose} cursor="pointer" p="$2">
          <IconX size="$1.5" color="$color11" />
        </Stack>
      </XStack>

      <XStack ai="center" gap="$2">
        <Paragraph
          size="$10"
          fontWeight="700"
          color="$color12"
          $theme-light={{ color: '$color12' }}
        >
          {numericAmount}
        </Paragraph>
        {symbol && (
          <XStack>
            <IconCoin symbol={symbol} size="$2" />
          </XStack>
        )}
      </XStack>

      {/* Note */}
      {note && (
        <Paragraph size="$5" color="$color11">
          {decodeURIComponent(note)}
        </Paragraph>
      )}

      {/* Date */}
      <XStack jc="space-between" ai="center" pt="$2">
        <Paragraph size="$4" color="$color10">
          {isReceived ? 'Received on' : 'Sent on'}
        </Paragraph>
        <Paragraph size="$4" color="$color11">
          {date || ''}
        </Paragraph>
      </XStack>
    </YStack>
  )
}

export const Transaction = ({ open, onClose, transaction }: TransactionProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null)
  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [open])
  const { bottom, top } = useSafeAreaInsets()

  return (
    <Portal zIndex={200}>
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        onClose={onClose}
        bottomInset={bottom}
        topInset={top}
        handleComponent={null}
      >
        <BottomSheetView>
          {transaction && <TransactionContent transaction={transaction} onClose={onClose} />}
        </BottomSheetView>
      </BottomSheet>
      <AnimatePresence>
        {open && (
          <View
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
