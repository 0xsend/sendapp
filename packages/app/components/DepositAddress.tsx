import {
  AnimatePresence,
  Button,
  Dialog,
  Paragraph,
  Sheet,
  Theme,
  useToastController,
  XStack,
  YStack,
  type ButtonProps,
} from '@my/ui'
import { CheckCheck } from '@tamagui/lucide-icons'
import { shorten } from 'app/utils/strings'
import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'
import type { Address } from 'viem'
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
            <Paragraph>
              1. The external address is on the Base Network and{' '}
              <a
                target="_blank"
                href="https://support.send.app/en/articles/9809554-smart-contract-deposit-issue"
                rel="noreferrer"
              >
                can receive transfers from Smart Contracts
              </a>
            </Paragraph>

            <Paragraph>
              2. I have double checked that the tokens USDC, SEND, ETH, or SPX are on Base Network.
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
  const [copyAddressDialogIsOpen, setCopyAddressDialogIsOpen] = useState(false)

  if (!address) return null

  const copyOnPress = async () => {
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
        <Button.Text fontSize={'$4'} fontWeight={'500'} px="$2">
          {shorten(address, 6, 5)}
        </Button.Text>

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
          copyOnPress()
          setCopyAddressDialogIsOpen(false)
          setHasCopied(true)
        }}
      />
    </>
  )
}
