import {
  Button,
  SizableText,
  XStack,
  YStack,
} from "@my/ui"
import { Link } from '@my/ui/src/components'
import { useThemeSetting } from "@tamagui/next-theme"
import { Switch } from "app/features/send/components/switch"
import { IQRScreenProps } from "app/features/send/types"
import { IconArrowLeft } from "app/components/icons"

export const QRScanScreen = ({ setCurrentScreen }: IQRScreenProps) => {
  const { resolvedTheme } = useThemeSetting()

  return (
    <YStack
      gap={'$5'}
      px={'$5'}
      pt={'$size.8'}
      pb={'$7'}
      jc={'space-between'}
      fullscreen
      $shorter={{
        pt: '$8',
        pb: '$6'
      }}
    >
      <XStack jc={'center'}>
        <SizableText
          fontSize={'$9'}
          fontWeight={'700'}
          mr={'$2.5'}
          $shorter={{ fontSize: '$8' }}
        >
          QR Code
        </SizableText>
      </XStack>

      <YStack ai={'center'} gap={'$5'}>
        <SizableText color={'$white'}>Scan QR Code to pay!</SizableText>
        <Switch
          leftText="Scan"
          rightText="My Code"
          leftHandler={() => { }}
          rightHandler={() => setCurrentScreen(['qr-mycode', 1])}
          active="left"
        />
      </YStack>
      <Button
        pos={'absolute'}
        top={'$size.8'}
        left={'$5'}
        size="$2.5"
        circular
        bg={'$backgroundTransparent'}
        $shorter={{ top: '$size.4' }}
      >
        <Link href={'/'} display={'flex'}>
          <IconArrowLeft />
        </Link>
      </Button>
    </YStack>
  )
}