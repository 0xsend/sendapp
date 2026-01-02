import { useState } from 'react'
import {
  Anchor,
  Button,
  Card,
  H3,
  Link,
  Paragraph,
  useMedia,
  useThemeName,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import { Check, Copy, ExternalLink } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'
import type { Address } from 'viem'
import { IconArrowUp } from 'app/components/icons'

interface ExternalAddressHistoryScreenProps {
  address: Address
}

export function ExternalAddressHistoryScreen({ address }: ExternalAddressHistoryScreenProps) {
  const media = useMedia()
  const toast = useAppToast()
  const isDark = useThemeName()?.startsWith('dark')
  const [hasCopied, setHasCopied] = useState(false)

  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(address).catch(() => toast.error('Failed to copy address'))
    setHasCopied(true)
    toast.show('Address copied')
    setTimeout(() => setHasCopied(false), 2000)
  }

  // Block explorer URL for Base chain
  const blockExplorerUrl = `https://basescan.org/address/${address}`

  return (
    <YStack gap="$4" ai="center" w="100%" maw={1024} p="$4" f={1}>
      <Card gap="$4" size={media.gtMd ? '$7' : '$5'} padded elevation={1} w="100%">
        {/* Address Display */}
        <YStack gap="$3" ai="center">
          <H3 lineHeight={32} color="$color12" testID="externalAddressHistory">
            External Address History
          </H3>

          {/* Address with Copy Button */}
          <Button
            chromeless
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{
              backgroundColor: 'transparent',
              borderColor: 'transparent',
            }}
            focusStyle={{ backgroundColor: 'transparent' }}
            p={0}
            height="auto"
            onPress={copyToClipboard}
            testID="copyAddressButton"
          >
            <XStack gap="$2" ai="center">
              <Paragraph fontSize="$6" fontFamily="$mono" color="$color12">
                {truncatedAddress}
              </Paragraph>
              {hasCopied ? (
                <Check color="$primary" size="$1" $theme-light={{ color: '$color12' }} />
              ) : (
                <Copy
                  flexShrink={0}
                  size="$1"
                  color="$primary"
                  $theme-light={{ color: '$color12' }}
                />
              )}
            </XStack>
          </Button>
        </YStack>

        {/* No Activity Message */}
        <YStack gap="$3" ai="center" p="$6">
          <Paragraph color="$color10" fontSize="$5" textAlign="center">
            No Send activity found for this address.
          </Paragraph>
          <Paragraph color="$color10" fontSize="$4" textAlign="center">
            This address is not registered with Send. Activity history is only available for Send
            accounts.
          </Paragraph>
        </YStack>

        {/* Action Buttons */}
        <XStack w="100%" gap="$4" jc="center">
          {/* Send Button */}
          <Link href={`/send?recipient=${address}&idType=${address}`} asChild>
            <Button
              borderRadius="$4"
              jc="center"
              ai="center"
              bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              testID="externalAddressSendButton"
            >
              <Button.Icon>
                <IconArrowUp size="$1" color={isDark ? '$primary' : '$color12'} />
              </Button.Icon>
              <Button.Text color="$color12" fontSize="$4" fontWeight="400" textAlign="center">
                Send to this address
              </Button.Text>
            </Button>
          </Link>
        </XStack>

        {/* Links */}
        <XStack w="100%" gap="$4" jc="center">
          {/* Back to Profile Link */}
          <Link
            href={`/profile/${address}`}
            textDecorationLine="underline"
            fontSize="$4"
            color="$color10"
          >
            Back to Profile
          </Link>

          {/* Block Explorer Link */}
          <Anchor
            href={blockExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            textDecorationLine="underline"
            fontSize="$4"
            color="$color10"
          >
            <XStack gap="$1" ai="center">
              <Paragraph color="$color10">View on Basescan</Paragraph>
              <ExternalLink size={14} color="$color10" />
            </XStack>
          </Anchor>
        </XStack>
      </Card>
    </YStack>
  )
}
