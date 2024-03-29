import { Button, Image, Input, Link, SizableText, XStack, YStack, styled } from '@my/ui'
import { IconBack, IconClose } from 'app/components/icons'
import { SendConfirmModal } from 'app/features/send/components/modal'
import { useSubScreenContext, useTransferContext } from 'app/features/send/providers'
import { ANIMATE_DIRECTION_LEFT, SendScreen } from 'app/features/send/types'
import { useState } from 'react'

const CustomInput = styled(Input, {
  name: 'CustomInput',
  borderRadius: '$6',
  bg: '$color1',
  borderStyle: 'unset',
  paddingRight: '$9',
  fontSize: '$3',
  fontStyle: 'italic',
  width: '100%',
  height: '$4.5',
})

export const SendItScreen = () => {
  const { setCurrentComponent } = useSubScreenContext()
  const { currentToken, sendAmount, sendTo } = useTransferContext()

  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <YStack
        px={'$5'}
        pt={'$size.8'}
        pb={'$9'}
        fullscreen
        $shorter={{
          pt: '$8',
          pb: '$6',
        }}
      >
        <XStack jc={'center'}>
          <SizableText fontSize={'$9'} fontWeight={'700'} $shorter={{ fontSize: '$8' }}>
            Send it 🚀
          </SizableText>
        </XStack>
        <YStack gap={'$8'} mt={'$10'}>
          <YStack gap={'$5'}>
            <SizableText theme={'alt2'}>To</SizableText>
            <XStack ai={'center'} gap={'$3.5'}>
              <Image
                source={{ uri: sendTo?.avatar }}
                width={'$4.5'}
                height={'$4.5'}
                borderRadius={'$6'}
              />
              <SizableText fontSize={'$8'} fontWeight={'700'} color={'$primary'}>
                {sendTo?.name}
              </SizableText>
            </XStack>
          </YStack>
          <YStack gap={'$5'}>
            <SizableText theme={'alt2'}>Amount</SizableText>
            <XStack ai={'center'}>
              {currentToken?.icon}
              <SizableText fontSize={'$9'} ml={'$1.5'}>
                {currentToken?.name}
              </SizableText>
              <SizableText fontSize={'$9'} fontWeight={'700'} ml={'$2'}>
                {sendAmount}
              </SizableText>
            </XStack>
          </YStack>
          <YStack gap={'$5'}>
            <SizableText theme={'alt2'}>Add Note(optional)</SizableText>
            <CustomInput placeholder="Type here..." />
          </YStack>
        </YStack>

        <YStack fg={1} jc={'flex-end'}>
          <Button height={'$6'} borderRadius={'$9'} onPress={() => setShowModal(true)} />
        </YStack>
        <Button
          pos={'absolute'}
          top={'$size.8'}
          left={'$5'}
          size="$2.5"
          circular
          bg={'$background05'}
          $shorter={{ top: '$size.4' }}
          onPress={() => setCurrentComponent([SendScreen.SEND_TAG, ANIMATE_DIRECTION_LEFT])}
        >
          <IconBack />
        </Button>
        <Button
          pos={'absolute'}
          top={'$size.8'}
          right={'$5'}
          size="$2.5"
          circular
          bg={'$background05'}
          $shorter={{ top: '$size.4' }}
        >
          <Link href={'/'} display={'flex'}>
            <IconClose />
          </Link>
        </Button>
      </YStack>
      <SendConfirmModal showModal={showModal} setShowModal={setShowModal} />
    </>
  )
}
