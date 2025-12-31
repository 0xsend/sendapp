import { FadeCard, Paragraph, XStack, YStack, Button, Spinner } from '@my/ui'
import { Copy, Check } from '@tamagui/lucide-icons'
import { useState, useCallback } from 'react'
import * as Clipboard from 'expo-clipboard'

interface BankDetailsCardProps {
  bankName: string | null
  routingNumber: string | null
  accountNumber: string | null
  beneficiaryName: string | null
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
  paymentRails,
}: BankDetailsCardProps) {
  return (
    <FadeCard>
      <YStack gap="$2">
        <Paragraph fontSize="$6" fontWeight={600} pb="$2">
          Bank Account Details
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
          Loading bank details...
        </Paragraph>
      </YStack>
    </FadeCard>
  )
}
