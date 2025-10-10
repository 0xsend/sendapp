import { Button, XStack, Paragraph, useAppToast } from '@my/ui'
import { ChevronUp, ChevronDown } from '@tamagui/lucide-icons'
import { IconBadgeCheckSolid } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { useCallback } from 'react'
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
  const cantonWalletAddress = profile?.canton_party_verifications?.canton_wallet_address
  const shouldShowVerificationOption = !cantonWalletAddress && canConnectCantonWallet
  const shouldShowStatus = !!cantonWalletAddress

  const copyCantonAddress = useCallback(async () => {
    if (!cantonWalletAddress) return

    await Clipboard.setStringAsync(cantonWalletAddress)
      .then(() => toast.show('Copied Canton wallet address to clipboard'))
      .catch(() =>
        toast.error('Something went wrong', {
          message: 'We were unable to copy the Canton wallet address to clipboard',
        })
      )
  }, [cantonWalletAddress, toast.show, toast.error])

  const handleCopyPress = useCallback(
    (e) => {
      e.preventDefault()
      void copyCantonAddress()
    },
    [copyCantonAddress]
  )

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
