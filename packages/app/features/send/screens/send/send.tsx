import {
  Button,
  Container,
  Paragraph,
  YStack,
} from '@my/ui'
import { MainLayout } from 'app/components/layout'
import { NumPad } from '../../components/numpad'
import { ISendScreenProps } from '../../types'
import { useSharedState } from '../../providers/transfer-provider'

export const MainScreen = ({ setCurrentScreen }: ISendScreenProps) => {
  const { sharedState, updateSharedState } = useSharedState()

  const { sendAmount } = sharedState

  const setSendAmount = (val: string) => {
    updateSharedState({ sendAmount: val })
  }

  return (
    <>
      <MainLayout>
        <Container>
          <YStack maw={304} pt={'$10'} $shorter={{ maw: '$18', pt: '$8' }}>
            <NumPad value={sendAmount} setValue={setSendAmount} />
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