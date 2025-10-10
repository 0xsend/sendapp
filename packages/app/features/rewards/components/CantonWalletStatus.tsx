import { Button, XStack, Paragraph, useAppToast } from '@my/ui'
import { ChevronUp, ChevronDown } from '@tamagui/lucide-icons'
import { IconBadgeCheckSolid } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { useState, useCallback, useEffect } from 'react'
import * as Clipboard from 'expo-clipboard'

interface CantonWalletStatusProps {
  canConnectCantonWallet?: boolean
  isExpanded: boolean
  onToggle: () => void
}

export function CantonWalletStatus({
  canConnectCantonWallet,
  isExpanded,
  onToggle,
}: CantonWalletStatusProps) {
  const { profile } = useUser()
  const toast = useAppToast()
  const [hasCopied, setHasCopied] = useState(false)
  const cantonVerification = profile?.canton_party_verifications?.[0]

  const shouldShowVerificationOption = !cantonVerification && canConnectCantonWallet
  const shouldShowStatus = !!cantonVerification

  const copyCantonAddress = useCallback(async () => {
    if (!cantonVerification) return

    await Clipboard.setStringAsync(cantonVerification)
      .then(() => toast.show('Copied Canton Wallet Address to clipboard'))
      .catch(() => toast.error('Unable to copy'))
  }, [cantonVerification, toast])

  const handleCopyPress = useCallback(
    (e) => {
      e.preventDefault()
      setHasCopied(true)
      void copyCantonAddress()
    },
    [copyCantonAddress]
  )

  useEffect(() => {
    if (hasCopied) {
      const timeoutId = setTimeout(() => {
        setHasCopied(false)
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [hasCopied])

  if (!shouldShowVerificationOption && !shouldShowStatus) {
    return null
  }

  if (shouldShowStatus) {
    return (
      <Button
        chromeless
        unstyled
        onPress={handleCopyPress}
        cursor={'pointer'}
        hoverStyle={{
          backgroundColor: '$backgroundTransparent',
        }}
        pressStyle={{
          backgroundColor: 'transparent',
        }}
        focusStyle={{
          backgroundColor: 'transparent',
        }}
      >
        <XStack ai="center" gap="$2">
          <Paragraph>Canton Wallet Address Verified</Paragraph>
          <IconBadgeCheckSolid
            size={'$1.5'}
            color={'$primary'}
            $theme-light={{ color: '$color12' }}
          />
        </XStack>
      </Button>
    )
  }

  return (
    <Button chromeless unstyled onPress={onToggle}>
      <XStack ai="center" gap="$2">
        <Paragraph>Verify Canton Wallet Address</Paragraph>

        {isExpanded ? (
          <ChevronUp size={'$1.5'} color="$primary" $theme-light={{ color: '$color12' }} />
        ) : (
          <ChevronDown size={'$1.5'} color="$primary" $theme-light={{ color: '$color12' }} />
        )}
      </XStack>
    </Button>
  )
}
