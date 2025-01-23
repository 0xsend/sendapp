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
import { useState, useEffect, useRef } from 'react'
import type { Address } from 'viem'
import { IconCopy } from '../../../components/icons'
import QRCode from 'qrcode'

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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!address) return

    if (isWeb) {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        QRCode.toCanvas(canvas, address, {
          width: 240,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
          .then(() => {
            const logo = new window.Image()
            logo.onload = () => {
              if (ctx) {
                const logoSize = canvas.width * 0.15
                const logoX = (canvas.width - logoSize) / 2
                const logoY = (canvas.height - logoSize) / 2

                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(logoX - 1, logoY - 1, logoSize + 2, logoSize + 2)
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
              }
            }
            logo.src = '/logos/base.svg'
          })
          .catch(handleError)
      }
    } else {
      // Native implementation using data URL
      QRCode.toDataURL(address, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrCodeUrl(url)
        })
        .catch(handleError)
    }
  }, [address])

  const handleError = (err: Error) => {
    console.error(err)
    toast.show('Failed to generate QR code', {
      message: 'Please try again later',
      customData: {
        theme: 'red',
      },
    })
  }

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
          {(() => {
            switch (true) {
              case isWeb:
                return <canvas ref={canvasRef} width={240} height={240} />
              case Boolean(qrCodeUrl):
                return (
                  <YStack
                    position="relative"
                    backgroundColor="white"
                    padding={16}
                    borderRadius={8}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Image
                      source={{ uri: qrCodeUrl }}
                      width={240}
                      height={240}
                      objectFit="contain"
                      alt="QR Code"
                    />
                    <YStack
                      position="absolute"
                      backgroundColor="white"
                      padding={4}
                      borderRadius={4}
                      top="50%"
                      left="50%"
                      style={{
                        transform: 'translate(-18px, -18px)',
                      }}
                    >
                      <Image
                        source={{ uri: '/logos/base.svg' }}
                        width={28}
                        height={28}
                        objectFit="contain"
                        alt="Base Logo"
                      />
                    </YStack>
                  </YStack>
                )
              default:
                return null
            }
          })()}
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
