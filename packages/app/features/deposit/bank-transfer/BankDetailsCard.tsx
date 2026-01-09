import { FadeCard, Paragraph, XStack, YStack, Button, Spinner } from '@my/ui'
import { Copy, Check, HelpCircle } from '@tamagui/lucide-icons'
import { useState, useCallback } from 'react'
import * as Clipboard from 'expo-clipboard'
import { Link } from 'solito/link'

interface BankDetailsCardProps {
  bankName: string | null
  routingNumber: string | null
  accountNumber: string | null
  beneficiaryName: string | null
  depositMessage?: string | null
  paymentRails: string[]
  onInfoPress?: () => void
}

function CopyableField({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!value) return
    await Clipboard.setStringAsync(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  if (!value) return null

  return (
    <XStack jc="space-between" ai="center" py="$2">
      <YStack>
        <Paragraph
          fontSize="$3"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {label}
        </Paragraph>
        <Paragraph fontSize="$5" fontWeight={500} fontFamily="$mono">
          {value}
        </Paragraph>
      </YStack>
      <Button
        size="$2"
        chromeless
        onPress={handleCopy}
        icon={copied ? <Check size={16} color="$primary" /> : <Copy size={16} />}
      />
    </XStack>
  )
}

export function BankDetailsCard({
  bankName,
  routingNumber,
  accountNumber,
  beneficiaryName,
  depositMessage,
  paymentRails,
  onInfoPress,
}: BankDetailsCardProps) {
  const hasAch = paymentRails.includes('ach_push')
  const hasWire = paymentRails.includes('wire')
  const transferType =
    hasAch && hasWire ? 'ACH or wire transfer' : hasAch ? 'ACH transfer' : 'wire transfer'

  return (
    <FadeCard pos="relative">
      {onInfoPress && (
        <Button
          size="$3"
          circular
          animation="100ms"
          animateOnly={['transform']}
          boc="$aztec3"
          hoverStyle={{ boc: '$aztec4' }}
          pressStyle={{ boc: '$aztec4', scale: 0.9 }}
          onPress={onInfoPress}
          pos="absolute"
          top="$4"
          right="$4"
          zi={1}
        >
          <Button.Icon scaleIcon={1.2}>
            <HelpCircle size={16} />
          </Button.Icon>
        </Button>
      )}
      <YStack gap="$2">
        <Paragraph
          fontSize="$4"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
          pr={onInfoPress ? '$8' : '$2'}
        >
          Use your bank's {transferType} feature to deposit USD to your Send account.
        </Paragraph>

        {bankName && (
          <XStack jc="space-between" ai="center" py="$2">
            <YStack>
              <Paragraph
                fontSize="$3"
                color="$lightGrayTextField"
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Bank Name
              </Paragraph>
              <Paragraph fontSize="$5" fontWeight={500}>
                {bankName}
              </Paragraph>
            </YStack>
          </XStack>
        )}

        <CopyableField label="Routing Number" value={routingNumber} />
        <CopyableField label="Account Number" value={accountNumber} />
        <CopyableField label="Memo" value={depositMessage ?? null} />
        <CopyableField label="Beneficiary Name" value={beneficiaryName} />

        <Paragraph fontSize="$3" color="$color12" py="$4">
          <Paragraph fontSize="$3" fontWeight="bold" color="$color12">
            Important:
          </Paragraph>{' '}
          Include the memo exactly as shown. Missing or incorrect memos may result in delay and loss
          of funds.
        </Paragraph>

        <Link href="/deposit/bank-transfer/history" style={{ paddingTop: 8 }}>
          <Button size="$4" theme="green">
            View Transfer History
          </Button>
        </Link>
      </YStack>
    </FadeCard>
  )
}

export function BankDetailsCardSkeleton() {
  return (
    <FadeCard>
      <YStack ai="center" jc="center" py="$8">
        <Spinner size="large" color="$primary" />
        <Paragraph pt="$4" color="$lightGrayTextField">
          Loading deposit details...
        </Paragraph>
      </YStack>
    </FadeCard>
  )
}
