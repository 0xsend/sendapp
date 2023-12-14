import { useState } from 'react'
import {
  Button,
  Container,
  Paragraph,
  YStack,
} from '@my/ui'
import { MainLayout } from 'app/components/layout'
import { IconEthereum, IconUSDC } from 'app/components/icons'
import { NumPad } from '../../components/numpad'
import { Coin, SendScreenProps } from '../../types'

const assets: Coin[] = [
  { icon: <IconEthereum />, name: 'ETH' },
  { icon: <IconUSDC />, name: 'USDC' },
  { icon: <IconEthereum />, name: 'SEND' },
]

export const MainScreen = ({ setCurrentScreen }: SendScreenProps) => {
  const [sendAmount, setSendAmount] = useState('0.25')
  const balance = 1.25;

  return (
    <>
      <MainLayout>
        <Container>
          <YStack maw={304} pt={'$10'} $shorter={{ maw: '$18', pt: '$8' }}>
            <NumPad value={sendAmount} setValue={setSendAmount} balance={balance} />
            <Button
              my={'$5'}
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
              onPress={() => setCurrentScreen(['send-tag', 1])}
            >
              <Paragraph size={'$6'} fontWeight={'700'}>
                Continue
              </Paragraph>
            </Button>
          </YStack>
        </Container>
      </MainLayout>
    </>
  )
}