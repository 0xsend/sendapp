import {
  Button,
  Container,
  Paragraph,
  YStack,
} from '@my/ui'
import { MainLayout } from 'app/components/layout'
import { NumPad } from 'app/features/send/components/numpad'
import { ISendScreenProps } from 'app/features/send/types'
import { useTransferContext } from 'app/features/send/providers/transfer-provider'

export const MainScreen = ({ setCurrentScreen }: ISendScreenProps) => {
  const { sendAmount, setSendAmount } = useTransferContext()

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