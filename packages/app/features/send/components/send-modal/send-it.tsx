import {
  Adapt,
  Button,
  Dialog,
  Image,
  Input,
  Sheet,
  SizableText,
  Theme,
  XStack,
  YStack,
  styled,
} from "@my/ui"
import { IconClose } from "app/components/icons/IconClose"
import { SendButton } from "app/components/layout/footer/components/SendButton"
import { SendItModalProps } from "../../types"

const CustomInput = styled(Input, {
  name: 'CustomInput',
  borderRadius: '$6',
  bg: '$color1',
  borderStyle: 'unset',
  paddingRight: '$9',
  fontSize: '$3',
  fontStyle: 'italic',
  width: '100%',
  height: '$4.5'
})

export const SendItModal = ({ sendAmount, asset, tag, showModal, setCurrentModal }: SendItModalProps) => {
  return (
    <Theme name={'dark'}>
      <Dialog
        modal
        onOpenChange={(open) => {
          setCurrentModal('')
        }}
        open={showModal}
      >
        <Adapt when="sm" platform="touch">
          <Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom snapPoints={[100]}>
            <Sheet.Frame
              px={'$6'}
              pt={'$size.8'}
              pb={'$9'}
              borderRadius={0}
            >
              <Adapt.Contents />
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
          </Sheet>
        </Adapt>

        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />

          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            px={'$6'}
            pt={'$size.8'}
            pb={'$9'}
            fullscreen
          >
            <XStack jc={'center'}>
              <Dialog.Title>
                <SizableText fontSize={'$9'} fontWeight={'700'}>Send it 🚀</SizableText>
              </Dialog.Title>
            </XStack>
            <YStack gap={'$8'} mt={'$10'}>
              <YStack gap={'$5'}>
                <SizableText theme={'alt2'}>To</SizableText>
                <XStack ai={'center'} gap={'$3.5'}>
                  <Image
                    source={{ uri: tag?.avatar }}
                    width={'$4.5'}
                    height={'$4.5'}
                    borderRadius={'$6'}
                  />
                  <SizableText fontSize={'$8'} fontWeight={'700'} color={'$primary'}>{tag?.name}</SizableText>
                </XStack>
              </YStack>
              <YStack gap={'$5'}>
                <SizableText theme={'alt2'}>Amount</SizableText>
                <XStack ai={'center'}>
                  {asset?.icon}
                  <SizableText fontSize={'$9'} ml={'$1.5'}>{asset?.name}</SizableText>
                  <SizableText fontSize={'$9'} fontWeight={'700'} ml={'$2'}>{sendAmount}</SizableText>
                </XStack>
              </YStack>
              <YStack gap={'$5'}>
                <SizableText theme={'alt2'}>Add Note(optional)</SizableText>
                <CustomInput placeholder="Type here..." />
              </YStack>
            </YStack>

            <YStack fg={1} jc={'flex-end'}>
              <SendButton height={'$6'} borderRadius={'$9'} />
            </YStack>
            <Dialog.Close asChild displayWhenAdapted>
              <Button
                pos={'absolute'}
                top={'$size.8'}
                right={'$6'}
                size="$2.5"
                circular
                bg={'$backgroundTransparent'}
              >
                <IconClose />
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </Theme>
  )
}
