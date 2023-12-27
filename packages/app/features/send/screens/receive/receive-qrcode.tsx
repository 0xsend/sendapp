import {
  Button,
  SizableText,
  XStack,
  YStack,
} from "@my/ui"
import { Link } from '@my/ui/src/components'
import { useThemeSetting } from "@tamagui/next-theme"
import { IReceiveScreenProps } from "app/features/send/types"
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

      <XStack
        backgroundColor={resolvedTheme === 'dark' ? '$black' : '$primary'}
        borderRadius={'$7'}
        p={'$1'}
        gap={'$2'}
      >
        <Button
          fg={1}
          borderRadius={'$6'}
        >
          <SizableText
            fontWeight={'700'}
            color={resolvedTheme === 'dark' ? '$primary' : '$color12'}
          >
            Receive
          </SizableText>
        </Button>
        <Button
          fg={1}
          borderRadius={'$6'}
          backgroundColor={resolvedTheme === 'dark' ? '$black' : '$primary'}
          onPress={() => setCurrentScreen(['receive-tag', 1])}
        >
          <SizableText
            color={'$white'}
          >
            Request
          </SizableText>
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