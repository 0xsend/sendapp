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
import { IconClose, IconEthereum, IconUSDC } from 'app/components/icons'
import { Coin, ReceiveScreenProps } from '../../types'
import { NumPad } from '../../components/numpad'
import { RequestConfirmModal } from '../../components/modal'

const assets: Coin[] = [
  { icon: <IconEthereum />, name: 'ETH' },
  { icon: <IconUSDC />, name: 'USDC' },
  { icon: <IconEthereum />, name: 'SEND' },
]

export const ReceiveAmountScreen = ({ setCurrentScreen }: ReceiveScreenProps) => {
  const [requestAmount, setRequestAmount] = useState('0.0')
  const balance = 1.25
  const request_to = {
    name: 'ethentree',
    avatar: 'https://s3-alpha-sig.figma.com/img/eb19/3f8f/977bdbf2f05c1a17618f3ce2e06626d5?Expires=1702252800&Signature=C1er2rIICnn8qt7OmAxLKSmjXz2WM3idiguTKKKlLIfo4JG-m1Pnp2yaQBiKC0BDsd2If5wOO-f5gpeBGVGr9loIJyrDl-lgCd0LcSCXrTQwzem4R48AoZI5Pj0bup3ktx-VivSWhABO182Bm72qZ5rEUVnhk~hhdXahYJ7lDS5zZRVuZyuQPD6uyh2ndYAUre2P2e~gOKbZwmWlIjvHyV04hoOKsaxy4a2EzXklSky9ufuMEnvmwser2PqjLEtDh4pNZC3eAWctu4S1lTg~w2vxVMFEr6Ff1ShrAjEuCWhHE80XmSOXbtUwUf9naKmp2EA0ccWTA8ymYchD78hIBQ__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
  }

  const [showModal, setShowModal] = useState(false)

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
            source={{ uri: request_to.avatar }}
            width={'$2.5'}
            height={'$2.5'}
            borderRadius={'$3'}
            mr={'$2.5'}
          />
          <SizableText fontSize={'$8'} $shorter={{ fontSize: '$6' }}>Request</SizableText>
          <SizableText color={'$primary'} fontSize={'$8'} fontWeight={'700'} $shorter={{ fontSize: '$6' }}>{request_to.name}</SizableText>
        </XStack>
        <YStack maw={304} fg={1} $shorter={{ maw: '$18' }}>
          <NumPad value={requestAmount} setValue={setRequestAmount} balance={balance} />
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