import { Image, Paragraph, Text, YStack } from '@my/ui'
import type { Address } from 'viem'
import { useQRCode } from 'app/utils/useQRCode'

type DepositAddressQR = {
  address?: Address
  isConfirmed: boolean
  onPress: () => void
}

export function DepositAddressQR({ address, isConfirmed, onPress }: DepositAddressQR) {
  const { data: qrData, error } = useQRCode(address, {
    width: 240,
    logo: {
      path: '/logos/base.svg',
      size: 36,
    },
  })

  if (!address) return null

  if (error) {
    console.error(error)
    return <Paragraph color={'$error'}>Could not generate QR code</Paragraph>
  }

  return (
    <YStack ai="center" gap="$4" width="100%">
      <YStack
        position="relative"
        onPress={() => {
          !isConfirmed && onPress()
        }}
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
          {qrData?.qrCodeUrl && (
            <YStack position="relative">
              <Image
                source={{ uri: qrData.qrCodeUrl }}
                width={240}
                height={240}
                objectFit="contain"
                alt="QR Code"
              />
              {qrData.logoOverlay && (
                <YStack
                  position="absolute"
                  backgroundColor="white"
                  padding={4}
                  borderRadius={4}
                  top={qrData.logoOverlay.position.top}
                  left={qrData.logoOverlay.position.left}
                  style={{
                    transform: qrData.logoOverlay.position.transform,
                  }}
                >
                  <Image
                    source={{ uri: qrData.logoOverlay.uri }}
                    width={qrData.logoOverlay.size}
                    height={qrData.logoOverlay.size}
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
    </YStack>
  )
}
