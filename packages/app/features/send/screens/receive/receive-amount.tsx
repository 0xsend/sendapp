import { useState } from 'react'
import {
  Button,
  Image,
  Paragraph,
  SizableText,
  XStack,
  YStack,
} from '@my/ui'
import { Link } from '@my/ui/src/components'
import { IconClose } from 'app/components/icons'
import { IReceiveScreenProps } from 'app/features/send/types'
import { NumPad } from 'app/features/send/components/numpad'
import { RequestConfirmModal } from 'app/features/send/components/modal'
import { useTransferContext } from 'app/features/send/providers/transfer-provider'

export const ReceiveAmountScreen = ({ setCurrentScreen }: IReceiveScreenProps) => {
  const { transferState, updateTransferContext } = useTransferContext()

  const { requestAmount, requestTo } = transferState

  const [showModal, setShowModal] = useState(false)

  const setRequestAmount = (val: string) => {
    updateTransferContext({ requestAmount: val })
  }

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
            source={{ uri: requestTo?.avatar }}
            width={'$2.5'}
            height={'$2.5'}
            borderRadius={'$3'}
            mr={'$2.5'}
          />
          <SizableText fontSize={'$8'} $shorter={{ fontSize: '$6' }}>Request</SizableText>
          <SizableText
            color={'$primary'}
            fontSize={'$8'}
            fontWeight={'700'}
            $shorter={{ fontSize: '$6' }}
          >
            {requestTo?.name}
          </SizableText>
        </XStack>
        <YStack maw={304} fg={1} $shorter={{ maw: '$18' }}>
          <NumPad value={requestAmount} setValue={setRequestAmount} />
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
        >
          <Link href={'/'} display={'flex'}>
            <IconClose />
          </Link>
        </Button>
      </YStack>
      <RequestConfirmModal showModal={showModal} setShowModal={setShowModal} />
    </>
  )
}