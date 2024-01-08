import { useState } from 'react'
import {
  Button,
  Image,
  Paragraph,
  SizableText,
  XStack,
  YStack,
} from '@my/ui'
import { IconClose } from 'app/components/icons'
import { NumPad } from 'app/features/send/components/numpad'
import { RequestConfirmModal, SendConfirmModal } from 'app/features/send/components/modal'
import { useTransferContext, useSubScreenContext } from 'app/features/send/providers'
import { ANIMATE_DIRECTION_LEFT } from "app/features/send/types"

export const QRAmountScreen = () => {
  const { setCurrentComponent, sendOrRequest } = useSubScreenContext()
  const { sendTo, sendAmount, requestAmount, requestTo, setSendAmount, setRequestAmount } = useTransferContext()

  const [showModal, setShowModal] = useState(false)

  const to = sendOrRequest === 'Send' ? sendTo : requestTo
  const amount = sendOrRequest === 'Send' ? sendAmount : requestAmount
  const setAmount = sendOrRequest === 'Send' ? setSendAmount : setRequestAmount
  const ConfirmModal = sendOrRequest === 'Send' ? SendConfirmModal : RequestConfirmModal

  return (
    <>
      <YStack
        gap={'$5'}
        px={'$5'}
        pt={'$11'}
        pb={'$7'}
        ai={'center'}
        fullscreen
        $shorter={{
          pt: '$8',
          pb: '$6'
        }}
      >
        <XStack alignSelf={'flex-start'} ai={'center'} gap={'$2'}>
          <Image
            source={{ uri: to?.avatar }}
            width={'$2.5'}
            height={'$2.5'}
            borderRadius={'$3'}
            mr={'$2.5'}
          />
          <SizableText fontSize={'$8'} $shorter={{ fontSize: '$6' }}>{sendOrRequest}</SizableText>
          <SizableText
            color={'$primary'}
            fontSize={'$8'}
            fontWeight={'700'}
            $shorter={{ fontSize: '$6' }}
          >
            {to?.name}
          </SizableText>
        </XStack>
        <YStack maw={304} fg={1} $shorter={{ maw: '$18' }}>
          <NumPad value={amount} setValue={setAmount} />
          <YStack fg={1} jc={'flex-end'}>
            <Button
              py={'$6'}
              br={'$9'}
              bc={'$backgroundTransparent'}
              boc={'$borderColorFocus'}
              width={'100%'}
              maw={304}
              $shorter={{
                maw: '$18',
                py: '$5',
                br: '$7'
              }}
              onPress={() => setShowModal(true)}
            >
              <Paragraph size={'$6'} fontWeight={'700'}>
                Continue
              </Paragraph>
            </Button>
          </YStack>
        </YStack>
        <Button
          pos={'absolute'}
          top={'$11'}
          right={'$5'}
          size="$2.5"
          circular
          bg={'$backgroundTransparent'}
          $shorter={{ top: '$size.4' }}
          onPress={() => setCurrentComponent(['qr-scan', ANIMATE_DIRECTION_LEFT])}
        >
          <IconClose />
        </Button>
      </YStack>
      <ConfirmModal showModal={showModal} setShowModal={setShowModal} />
    </>
  )
}