import {
  Button,
  Paragraph,
  XStack,
  YStack,
  AnimatePresence,
  Theme,
  useToastController,
  type ButtonProps,
  Dialog,
  Sheet,
} from '@my/ui'
import type { Address } from 'viem'
import { shorten } from 'app/utils/strings'
import { useEffect, useState } from 'react'
import * as Sharing from 'expo-sharing'
import * as Clipboard from 'expo-clipboard'
import { CheckCheck } from '@tamagui/lucide-icons'
import { IconCopy } from './icons'

function CopyAddressDialog({ isOpen, onClose, onConfirm }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom open={isOpen} onOpenChange={onClose}>
          <Sheet.Frame padding="$4">
            <Dialog.Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </Dialog.Adapt>

      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content gap="$4">
          <YStack gap="$4">
            <Dialog.Title>Confirm External Deposit</Dialog.Title>
            <Dialog.Description>
              Please confirm you agree to the following before copying your address:
            </Dialog.Description>
            <Paragraph>1. The tokens I am depositing are on Base Network.</Paragraph>

            <Paragraph>
              2. I have double checked that the tokens are USDC, SEND, or ETH on Base Network.
            </Paragraph>

            <Paragraph>
              3. I understand that if I make any mistakes, there is no way to recover the funds.
            </Paragraph>

            <XStack justifyContent="flex-end" marginTop="$4" gap="$4">
              <Dialog.Close asChild>
                <Button br={'$2'}>Cancel</Button>
              </Dialog.Close>
              <Button theme="yellow_active" onPress={onConfirm} br={'$2'}>
                <Button.Text col={'$color12'}>I Agree & Copy</Button.Text>
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export function DepositAddress({ address, ...props }: { address?: Address } & ButtonProps) {
  const toast = useToastController()
  const [hasCopied, setHasCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [copyAddressDialogIsOpen, setCopyAddressDialogIsOpen] = useState(false)

  useEffect(() => {
    const canShare = async () => {
      const canShare = await Sharing.isAvailableAsync()
      setCanShare(canShare)
    }
    canShare()
  }, [])

  if (!address) return null

  const shareOrCopyOnPress = async () => {
    if (canShare) {
      return await Sharing.shareAsync(address)
    }

    await Clipboard.setStringAsync(address).catch(() =>
      toast.show('Something went wrong', {
        message: 'We were unable to copy your referral link to the clipboard',
        customData: {
          theme: 'red',
        },
      })
    )
  }

  return (
    <>
      <Button
        chromeless
        hoverStyle={{
          backgroundColor: 'transparent',
          borderColor: '$transparent',
        }}
        pressStyle={{
          backgroundColor: 'transparent',
        }}
        focusStyle={{
          backgroundColor: 'transparent',
        }}
        onPress={() => {
          setCopyAddressDialogIsOpen(true)
        }}
        {...props}
      >
        <Theme name="green">
          <Button.Text
            fontSize={'$4'}
            fontWeight={'500'}
            fontFamily={'$mono'}
            px="$2"
            bc="$background"
          >
            {shorten(address, 5, 4)}
          </Button.Text>
        </Theme>
        <Button.Icon>
          <AnimatePresence exitBeforeEnter>
            {hasCopied ? (
              <CheckCheck
                size={16}
                $theme-dark={{ color: '$primary' }}
                $theme-light={{ color: '$color12' }}
                key="referral-link-icon"
                animation="bouncy"
                enterStyle={{
                  opacity: 0,
                  scale: 0.9,
                }}
                exitStyle={{
                  opacity: 0,
                  scale: 0.9,
                }}
              />
            ) : (
              <IconCopy
                size={16}
                $theme-dark={{ color: '$primary' }}
                $theme-light={{ color: '$color12' }}
              />
            )}
          </AnimatePresence>
        </Button.Icon>
      </Button>
      <CopyAddressDialog
        isOpen={copyAddressDialogIsOpen}
        onClose={() => {
          setCopyAddressDialogIsOpen(false)
        }}
        onConfirm={() => {
          shareOrCopyOnPress()
          setCopyAddressDialogIsOpen(false)
          setHasCopied(true)
        }}
      />
    </>
  )
}
