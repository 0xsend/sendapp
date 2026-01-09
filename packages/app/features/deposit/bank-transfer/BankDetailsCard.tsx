import { FadeCard, Paragraph, XStack, YStack, Button, Spinner } from '@my/ui'
import { Copy, Check } from '@tamagui/lucide-icons'
import { useState, useCallback } from 'react'
import * as Clipboard from 'expo-clipboard'

interface BankDetailsCardProps {
  bankName: string | null
  routingNumber: string | null
  accountNumber: string | null
  beneficiaryName: string | null
  depositMessage?: string | null
  paymentRails: string[]
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
}: BankDetailsCardProps) {
  return (
    <FadeCard>
      <YStack gap="$2">
        <Paragraph
          fontSize="$4"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Send a USD bank transfer using the details below. Your deposit is matched using the memo.
        </Paragraph>
        <Paragraph
          fontSize="$4"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Important: include the memo exactly as shown. Missing or incorrect memos can delay your
          deposit, cause it to be returned, or require manual support to recover funds.
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
        <CopyableField label="Beneficiary Name" value={beneficiaryName} />
        <CopyableField label="Memo" value={depositMessage ?? null} />

        {paymentRails.length > 0 && (
          <XStack jc="space-between" ai="center" py="$2">
            <YStack>
              <Paragraph
                fontSize="$3"
                color="$lightGrayTextField"
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Supported Methods
              </Paragraph>
              <Paragraph fontSize="$5" fontWeight={500}>
                {paymentRails.map((r) => (r === 'ach_push' ? 'ACH' : 'Wire')).join(', ')}
              </Paragraph>
            </YStack>
          </XStack>
        )}

        <Paragraph fontSize="$3" color="$lightGrayTextField" ta="center">
          ACH transfers typically arrive within 1-3 business days. Wire transfers are usually
          same-day.
        </Paragraph>
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
