import {
  Button,
  Image,
  SizableText,
  Theme,
  ThemeName,
  XStack,
  YStack,
} from "@my/ui"
import { Link } from '@my/ui/src/components'
import { useThemeSetting } from "@tamagui/next-theme"
import { ReceiveScreenProps } from "../../types"
import { IconArrowLeft, IconCopy } from "app/components/icons"

import qrcode from "app/assets/img/qr.png"

export const ReceiveQRCodeScreen = ({ setCurrentScreen }: ReceiveScreenProps) => {
  const { resolvedTheme } = useThemeSetting()

  const share_link = 'send.app/brother'

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
          Receive
        </SizableText>
      </XStack>

      <YStack ai={'center'}>
        <Image
          source={{ uri: qrcode.src }}
          width={330}
          height={330}
          mb={'$6'}
        />
        <SizableText theme={'alt1'}>Share your payment link</SizableText>
        <XStack ai={'center'} gap="$3">
          <SizableText color={'$primary'} fontWeight={'700'}>{share_link}</SizableText>
          <IconCopy />
        </XStack>
      </YStack>

      <XStack
        backgroundColor={resolvedTheme === 'dark' ? '$black' : '$white'}
        borderRadius={'$7'}
        p={'$1'}
        gap={'$2'}
      >
        <Button
          borderRadius={'$6'}
          flexBasis={'50%'}
        >
          <SizableText fontWeight={'700'} color={'$primary'}>Receive</SizableText>
        </Button>
        <Button
          borderRadius={'$6'}
          backgroundColor={resolvedTheme === 'dark' ? '$black' : '$white'}
          flexBasis={'50%'}
          onPress={() => setCurrentScreen(['receive-tag', 1])}
        >
          Request
        </Button>
      </XStack>
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