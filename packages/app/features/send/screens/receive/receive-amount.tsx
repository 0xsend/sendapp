import { useState } from 'react'
import {
  Button,
  Container,
  Paragraph,
  YStack,
} from '@my/ui'
import { IconClose, IconEthereum, IconUSDC } from 'app/components/icons'
import { NumPad } from '../../components/numpad'
import { Coin, ReceiveScreenProps } from '../../types'
import { Link } from '@my/ui/src/components'

const assets: Coin[] = [
  { icon: <IconEthereum />, name: 'ETH' },
  { icon: <IconUSDC />, name: 'USDC' },
  { icon: <IconEthereum />, name: 'SEND' },
]

export const ReceiveAmountScreen = ({ setCurrentScreen }: ReceiveScreenProps) => {
  const [sendAmount, setSendAmount] = useState('0.0')
  const balance = 1.25;

  return (
    <Container>
      <YStack maw={314} pt={'$10'} $shorter={{ maw: '$18', pt: '$8' }}>
        <NumPad value={sendAmount} setValue={setSendAmount} balance={balance} />
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
        // onPress={() => setCurrentScreen(['sendtag', 1])}
        >
          <Paragraph size={'$6'} fontWeight={'700'}>
            Continue
          </Paragraph>
        </Button>
        <Button
          pos={'absolute'}
          top={'$size.8'}
          right={'$6'}
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
    </Container>
  )
}