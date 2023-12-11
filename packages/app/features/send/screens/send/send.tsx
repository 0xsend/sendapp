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
import { Select } from '../../components/select'
import { NumPad } from '../../components/numpad'
import { Coin, SendScreenProps } from '../../types'

const assets: Coin[] = [
  { icon: <IconEthereum />, name: 'ETH' },
  { icon: <IconEthereum />, name: 'USDC' },
  { icon: <IconEthereum />, name: 'SEND' },
]

export const MainScreen = ({ setCurrentScreen }: SendScreenProps) => {
  const [sendAmount, setSendAmount] = useState('0.25')

  return (
    <>
      <MainLayout>
        <Container>
          <YStack maw={314} pt={'$10'} $shorter={{ maw: '$18', pt: '$8' }}>
            <XStack jc={'center'}>
              <H1
                size={sendAmount.length > 4 ? sendAmount.length > 8 ? '$10' : '$12' : '$14'}
                minHeight={'$10'}
                $shorter={{
                  size: sendAmount.length > 4 ? sendAmount.length > 8 ? '$10' : '$11' : '$12',
                  minHeight: '$7'
                }}
              >
                {Number(sendAmount).toLocaleString()}
              </H1>
            </XStack>
            <XStack jc={'space-between'} mt={'$2'}>
              <Select items={assets} />
              <XStack
                px={'$5'}
                py={'$2.5'}
                space={'$1.5'}
                br={'$6'}
                borderWidth={1}
                borderColor={'$backgroundFocus'}
                $shorter={{
                  px: '$4',
                  py: '$2'
                }}
              >
                <Paragraph theme={'alt2'}>Bal</Paragraph>
                <Paragraph fontWeight={'700'}>1.25</Paragraph>
              </XStack>
            </XStack>
            <NumPad value={sendAmount} setValue={setSendAmount} />
            <Button
              my={'$5'}
              py={'$6'}
              br={'$9'}
              bc={'$backgroundTransparent'}
              boc={'$borderColorFocus'}
              width={'100%'}
              maw={314}
              $shorter={{
                maw: '18',
                py: '$4',
                br: '$7'
              }}
              onPress={() => setCurrentScreen(['sendtag', 1])}
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