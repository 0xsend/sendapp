import { boundingBox } from '@yudiel/react-qr-scanner'
import { Scanner } from './Scanner'
import { Button, Container, isWeb, useMedia, usePwa, XStack, YStack } from '@my/ui'
import { useState } from 'react'
import { IconArrowLeft } from 'app/components/icons'
import { Flashlight } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'

export function ScanScreen() {
  const media = useMedia()
  const [isScannerView, setIsScannerView] = useState(!media.gtMd)

  if (media.gtMd) return <QrCodeView />

  return <ScannerView />
}

const ScannerView = () => {
  const router = useRouter()
  const [isPaused, setIsPaused] = useState(false)
  const isPwa = usePwa()
  return (
    <Scanner
      constraints={{}}
      onScan={console.log}
      formats={['qr_code']}
      components={{
        torch: true,
        zoom: true,
        finder: true,
        tracker: boundingBox,
      }}
      scanDelay={2000}
      paused={isPaused}
    >
      <YStack fullscreen>
        <Container safeAreaPadding="y" pt={isPwa ? undefined : '$6'}>
          <XStack jc="space-between" w="100%">
            <Button chromeless icon={<IconArrowLeft size={'$4'} />} onPress={() => router.back()} />
            <Button
              chromeless
              icon={<Flashlight size={'$4'} />}
              onPress={() => console.log('flashlight')}
            />
          </XStack>
        </Container>
      </YStack>
    </Scanner>
  )
}

const QrCodeView = () => {
  return <div>QR Code View</div>
}
