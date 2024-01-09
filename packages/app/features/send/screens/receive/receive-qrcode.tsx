import { Button, Link, SizableText, XStack, YStack } from '@my/ui'
import { IconArrowLeft, IconCopy } from 'app/components/icons'
import { Switch } from 'app/features/send/components/switch'
import { useSubScreenContext } from 'app/features/send/providers'
import { ANIMATE_DIRECTION_RIGHT } from 'app/features/send/types'

export const ReceiveQRCodeScreen = () => {
  const { setCurrentComponent } = useSubScreenContext()
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
        pb: '$6',
      }}
    >
      <XStack jc={'center'}>
        <SizableText fontSize={'$9'} fontWeight={'700'} mr={'$2.5'} $shorter={{ fontSize: '$8' }}>
          Receive
        </SizableText>
      </XStack>

      <YStack ai={'center'}>
        <XStack width={330} height={330} backgroundColor={'$primary'} mb={'$6'} />
        <SizableText theme={'alt1'}>Share your payment link</SizableText>
        <XStack ai={'center'} gap="$3">
          <SizableText color={'$primary'} fontWeight={'700'}>
            {share_link}
          </SizableText>
          <IconCopy />
        </XStack>
      </YStack>
      <Switch
        leftText={'Receive'}
        leftHandler={() => {}}
        rightText={'Request'}
        rightHandler={() => setCurrentComponent(['receive-tag', ANIMATE_DIRECTION_RIGHT])}
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
