
import {
  Adapt,
  Button,
  Dialog,
  Image,
  Sheet,
  SizableText,
  Theme,
  ThemeName,
  XStack,
  YStack,
} from "@my/ui"
import { useThemeSetting } from "@tamagui/next-theme"
import { IconClose } from "app/components/icons"
import { ISendRequestModalProps } from "app/features/send/types"
import { SendButton } from "app/components/layout/footer/components/SendButton"
import { GradientButton } from "./GradientButton"

export const SendRequestModal = ({ showModal, setShowModal, to }: ISendRequestModalProps) => {
  const { resolvedTheme } = useThemeSetting()

  return (
    <Theme name={resolvedTheme as ThemeName}>
      <Dialog
        modal
        onOpenChange={(open) => {
          setShowModal(open)
        }}
        open={showModal}
      >
        <Adapt when="sm" platform="touch">
          <Sheet animation="medium" zIndex={200000} modal snapPointsMode="fit">
            <Sheet.Frame
              p={'$7'}
              borderRadius={'$11'}
            >
              <Adapt.Contents />
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              opacity={0.7}
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
            px={'$7'}
            backgroundColor={resolvedTheme === 'dark' ? '$black' : '$white'}
            fullscreen
          >
            <YStack>
              <XStack jc={'space-between'}>
                <Image
                  source={{ uri: to?.avatar }}
                  width={'$12'}
                  height={'$12'}
                  borderRadius={'$6'}
                />
                <XStack
                  width={'$12'}
                  height={'$12'}
                  borderWidth={1}
                  borderColor={'$primary'}
                  borderRadius={'$6'}
                />
              </XStack>
              <SizableText
                mt={'$8'}
                textAlign={'center'}
                fontSize={'$9'}
                fontWeight={'700'}
              >
                {to?.name}
              </SizableText>
              <SizableText
                mt={'$5'}
                textAlign={'center'}
                fontSize={'$6'}
                color={'$primary'}
              >
                @{to?.name.toLowerCase()}
              </SizableText>
              <SizableText
                mt={'$6'}
                textAlign={'center'}
                fontSize={'$3'}
                theme={'alt1'}
                fontWeight={'400'}
              >
                Aooarels, Footwears, Sneakers, Boots, Shoes
              </SizableText>
              <YStack mt={'$7'} gap={'$3.5'}>
                <SendButton height={'$5'} borderRadius={'$6'} iconHeight={12} blackIcon />
                <GradientButton height={'$5'} borderRadius={'$6'}>
                  <SizableText
                    size={'$5'}
                    fontWeight={'700'}
                    color={resolvedTheme === 'dark' ? '$color2' : '$color12'}
                  >
                    Request
                  </SizableText>
                </GradientButton>
                <Button
                  // py={'$4'}
                  height={'$5'}
                  br={'$6'}
                  bc={'$backgroundTransparent'}
                  boc={'$primary'}
                  width={'100%'}
                  $shorter={{
                    maw: '$18',
                    py: '$5',
                    br: '$7'
                  }}
                  onPress={() => setShowModal(true)}
                >
                  <SizableText size={'$5'} fontWeight={'700'}>
                    + Favorite
                  </SizableText>
                </Button>
              </YStack>
            </YStack>
            <Dialog.Close asChild displayWhenAdapted>
              <Button
                pos={'absolute'}
                top={'$7'}
                right={'$4.5'}
                size="$2.5"
                circular
                bg={'$backgroundTransparent'}
              >
                <IconClose opacity={0.5} />
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </Theme>
  )
}