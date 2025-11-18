import { QRCode, Text, YStack } from '@my/ui'
import type { Address } from 'viem'
import { IconBase } from 'app/components/icons'
import { useTranslation } from 'react-i18next'

type DepositAddressQR = {
  address?: Address
  isConfirmed: boolean
  onPress: () => void
}

export function DepositAddressQR({ address, isConfirmed, onPress }: DepositAddressQR) {
  const { t } = useTranslation('deposit')

  if (!address) return null

  return (
    <YStack ai="center" gap="$4" width="100%" cursor={'pointer'}>
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
          <QRCode value={address} size={240} centerComponent={<IconBase size={'$5'} />} />
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
              {t('crypto.qr.reveal')}
            </Text>
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
