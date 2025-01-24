import {
  AnimatePresence,
  Button,
  Dialog,
  H4,
  Paragraph,
  Sheet,
  Text,
  useToastController,
  XStack,
  YStack,
  Image,
  type ButtonProps,
  isWeb,
} from '@my/ui'
import { CheckCheck } from '@tamagui/lucide-icons'
import { shorten } from 'app/utils/strings'
import * as Clipboard from 'expo-clipboard'
import { useState, useEffect } from 'react'
import type { Address } from 'viem'
import { IconCopy } from '../../../components/icons'
import { useQRCode } from '../../../utils/useQRCode'

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
              Please confirm you agree to the following before proceeding:
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
                <Button.Text col={'$color12'}>I Agree & Proceed</Button.Text>
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
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [copyAddressDialogIsOpen, setCopyAddressDialogIsOpen] = useState(false)

  const { qrCodeUrl, error, logoOverlay } = useQRCode(address, {
    width: 240,
    logo: {
      path: '/logos/base.svg',
      size: 36,
    },
  })

  useEffect(() => {
    if (error) {
      toast.show('Failed to generate QR code', {
        message: 'Please try again later',
        customData: {
          theme: 'red',
        },
      })
    }
  }, [error, toast])

  if (!address) return null

  const copyOnPress = async () => {
    if (!isConfirmed) {
      setCopyAddressDialogIsOpen(true)
      return
    }

    await Clipboard.setStringAsync(address).catch(() =>
      toast.show('Something went wrong', {
        message: 'We were unable to copy your referral link to the clipboard',
        customData: {
          theme: 'red',
        },
      })
    )
    setHasCopied(true)
  }

  return (
    <YStack ai="center" gap="$4" width="100%">
      <YStack
        position="relative"
        style={(() => {
          switch (true) {
            case isWeb:
              return {
                cursor: isConfirmed ? 'default' : 'pointer',
              }
            default:
              return undefined
          }
        })()}
        onPress={() => !isConfirmed && setCopyAddressDialogIsOpen(true)}
      >
        <YStack
          style={{
            filter: isConfirmed ? 'none' : 'blur(2px)',
            transition: 'filter 0.2s ease-in-out',
            backgroundColor: '#ffffff',
            padding: 16,
            borderRadius: 8,
          }}
        >
          {qrCodeUrl && (
            <YStack position="relative">
              <Image
                source={{ uri: qrCodeUrl }}
                width={240}
                height={240}
                objectFit="contain"
                alt="QR Code"
              />
              {logoOverlay && (
                <YStack
                  position="absolute"
                  backgroundColor="white"
                  padding={4}
                  borderRadius={4}
                  top={logoOverlay.position.top}
                  left={logoOverlay.position.left}
                  style={{
                    transform: logoOverlay.position.transform,
                  }}
                >
                  <Image
                    source={{ uri: logoOverlay.uri }}
                    width={logoOverlay.size}
                    height={logoOverlay.size}
                    objectFit="contain"
                    alt="Base Logo"
                  />
                </YStack>
              )}
            </YStack>
          )}
        </YStack>
        {!isConfirmed && (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            ai="center"
            jc="center"
            backgroundColor="$background"
            opacity={0.9}
            borderRadius={8}
          >
            <Text color="$color" fontSize="$4">
              Click to reveal QR code
            </Text>
          </YStack>
        )}
      </YStack>

      <H4 fontWeight="400">Deposit on Base</H4>

      <XStack width="100%" ai="center" jc="center">
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
          onPress={copyOnPress}
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
      </XStack>

      <CopyAddressDialog
        isOpen={copyAddressDialogIsOpen}
        onClose={() => {
          setCopyAddressDialogIsOpen(false)
        }}
        onConfirm={() => {
          setIsConfirmed(true)
          setCopyAddressDialogIsOpen(false)
          if (!isConfirmed) return
          copyOnPress()
        }}
      />
    </YStack>
  )
}
