import {
  Button,
  SizableText,
  XStack,
  YStack,
} from "@my/ui"
import { Link } from '@my/ui/src/components'
import { useThemeSetting } from "@tamagui/next-theme"
import { IReceiveScreenProps } from "app/features/send/types"
import { Switch } from "app/features/send/components/switch"
import { IconArrowLeft, IconCopy } from "app/components/icons"

export const ReceiveQRCodeScreen = ({ setCurrentScreen }: IReceiveScreenProps) => {
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
        <XStack
          width={330}
          height={330}
          backgroundColor={'$primary'}
          mb={'$6'}
        />
        <SizableText theme={'alt1'}>Share your payment link</SizableText>
        <XStack ai={'center'} gap="$3">
          <SizableText color={'$primary'} fontWeight={'700'}>{share_link}</SizableText>
          <IconCopy />
        </XStack>
      </YStack>
      <Switch
        leftText={'Receive'}
        leftHandler={() => { }}
        rightText={'Request'}
        rightHandler={() => setCurrentScreen(['receive-tag', 1])}
        active={'left'}
      />
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