import { Button, Container, Paragraph, YStack } from '@my/ui'
import { MainLayout } from 'app/components/layout/index.native'
import { NumPad } from 'app/features/send/components/numpad'
import { useSubScreenContext, useTransferContext } from 'app/features/send/providers'
import { ANIMATE_DIRECTION_RIGHT, SendScreen } from 'app/features/send/types'

export const MainScreen = () => {
  const { setCurrentComponent } = useSubScreenContext()
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
              bc={'$background05'}
              boc={'$borderColorFocus'}
              width={'100%'}
              maw={304}
              $shorter={{
                maw: '$18',
                py: '$5',
                br: '$7',
              }}
              onPress={() => setCurrentComponent([SendScreen.SEND_TAG, ANIMATE_DIRECTION_RIGHT])}
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
