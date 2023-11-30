import { useState } from 'react'
import {
  Button,
  Container,
  H1,
  Paragraph,
  XStack,
  YStack,
} from '@my/ui'
import { MainLayout } from 'app/components/layout'
import { IconEthereum } from 'app/components/icons/IconEthereum'
import { Select } from './components/select'
import { NumPad } from './components/numpad'
import { SendModal } from './components/send-modal'

const assets: IAsset[] = [
  { icon: <IconEthereum />, name: 'ETH' },
  { icon: <IconEthereum />, name: 'BSC' },
  { icon: <IconEthereum />, name: 'TRON' },
]

export const SendScreen = () => {
  const [sendAmount, setSendAmount] = useState('0.25')
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <MainLayout>
        <Container>
          <YStack maw={316} pt={'$13'}>
            <XStack jc={'center'}>
              <H1 size={sendAmount.length > 4 ? sendAmount.length > 8 ? '$9' : '$12' : '$15'}>
                {Number(sendAmount).toLocaleString()}
              </H1>
              <XStack pos={'absolute'} r={0} space={'$1.5'}>
                <Paragraph theme={'alt2'}>Bal</Paragraph>
                <Paragraph fontWeight={'700'}>1.25</Paragraph>
              </XStack>
            </XStack>
            <XStack jc={'center'} mt={'$6'}>
              <Select items={assets} />
            </XStack>
            <NumPad value={sendAmount} setValue={setSendAmount} />
            <Button
              my={'$6'}
              py={'$6'}
              borderRadius={'$9'}
              bc={'$backgroundTransparent'}
              boc={'$borderColorFocus'}
              onPress={() => {
                console.log(showModal)
                setShowModal(true)
              }}
            >
              <Paragraph size={'$6'} fontWeight={'700'}>
                Continue
              </Paragraph>
            </Button>
          </YStack>
        </Container>
      </MainLayout>
      <SendModal sendAmount={sendAmount} asset={assets[0]} showModal={showModal} setShowModal={setShowModal} />
    </>
  )
}
