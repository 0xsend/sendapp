import { FadeCard, Paragraph, XStack, YStack, Button, Spinner, SelectableText } from '@my/ui'
import { Copy, Check, HelpCircle } from '@tamagui/lucide-icons'
import { useState, useCallback } from 'react'
import * as Clipboard from 'expo-clipboard'
import { Link } from 'solito/link'

interface BankDetailsCardProps {
  bankName: string | null
  routingNumber: string | null
  accountNumber: string | null
  bankAddress: string | null
  depositMessage?: string | null
  paymentRails: string[]
  onInfoPress?: () => void
}

/**
 * Format a 9-digit ZIP code:
 * - If +4 is 0000, show just 5-digit ZIP (820010000 → 82001)
 * - Otherwise add hyphen (820012636 → 82001-2636)
 */
function formatZipCode(text: string): string {
  return text.replace(/\b(\d{5})(\d{4})\b/g, (_, zip5, plus4) =>
    plus4 === '0000' ? zip5 : `${zip5}-${plus4}`
  )
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  USA: 'United States',
}

function formatCountry(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code
}

/**
 * Parse address string into formatted lines.
 * Input: "1712 Pioneer Avenue, Suite 2636, Cheyenne, Wyoming 820010000, US"
 * Output: ["1712 Pioneer Avenue", "Suite 2636", "Cheyenne, Wyoming 82001", "United States"]
 */
function formatAddress(address: string): string[] {
  const parts = address.split(',').map((part) => part.trim())
  if (parts.length <= 2) return parts

  // Group: street, suite/unit, city+state+zip, country
  const street = parts[0]
  const suite = parts.length > 3 ? parts[1] : undefined
  const cityStateZip =
    parts.length > 3 ? parts.slice(2, -1).join(', ') : parts.slice(1, -1).join(', ')
  const country = parts[parts.length - 1]

  return [
    street,
    suite,
    cityStateZip ? formatZipCode(cityStateZip) : undefined,
    country ? formatCountry(country) : undefined,
  ].filter((line): line is string => !!line)
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
        <SelectableText fontSize="$5" fontWeight={500} fontFamily="$mono">
          {value}
        </SelectableText>
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

function AddressField({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!value) return
    await Clipboard.setStringAsync(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  if (!value) return null

  const lines = formatAddress(value)

  return (
    <XStack jc="space-between" ai="flex-start" py="$2">
      <YStack f={1}>
        <Paragraph
          fontSize="$3"
          color="$lightGrayTextField"
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {label}
        </Paragraph>
        <YStack>
          {lines.map((line) => (
            <SelectableText key={line} fontSize="$5" fontWeight={500}>
              {line}
            </SelectableText>
          ))}
        </YStack>
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
  bankAddress,
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

        <CopyableField label="Account Type" value="Checking" />
        <CopyableField label="Bank Name" value={bankName} />
        <CopyableField label="Routing Number" value={routingNumber} />
        <CopyableField label="Account Number" value={accountNumber} />
        <AddressField label="Bank Address" value={bankAddress} />
        <CopyableField label="Memo" value={depositMessage ?? null} />

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
