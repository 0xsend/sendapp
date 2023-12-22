import { useState } from "react"
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
import { ProfileModal } from "./profile-modal"

export const SendRequestModal = ({
  showModal,
  setShowModal,
  to,
  setCurrentScreen,
  sendOrRequest
}: ISendRequestModalProps) => {
  const { resolvedTheme } = useThemeSetting()
  const [showProfileModal, setShowProfileModal] = useState(false)

  return (
    <>
      <Theme name={resolvedTheme as ThemeName}>
        <Dialog
          modal
          onOpenChange={(open) => {
            setShowModal(open)
          }}
          open={showModal}
        >
          <Adapt when="sm" platform="touch">
            <Sheet animation="medium" zIndex={200000} modal snapPoints={[100]}>
              <Sheet.Frame
                p={'$5'}
                backgroundColor={'$backgroundTransparent'}
                jc={'center'}
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
              fullscreen
            >
              <YStack ai={'center'}>
                <YStack backgroundColor={'$background'} p={'$7'} borderRadius={'$10'}
                  $shorter={{
                    px: '$6',
                    py: '$5',
                  }}>
                  <XStack jc={'space-between'}>
                    <Image
                      source={{ uri: to?.avatar }}
                      width={'$12'}
                      height={'$12'}
                      borderRadius={'$6'}
                      $shorter={{
                        width: '$10',
                        height: '$10',
                      }}
                    />
                    {/* TODO: Place QR-Code img here instead of XStack */}
                    <XStack
                      width={'$12'}
                      height={'$12'}
                      borderWidth={1}
                      borderColor={'$primary'}
                      borderRadius={'$6'}
                      $shorter={{
                        width: '$10',
                        height: '$10',
                      }}
                    />
                  </XStack>
                  <SizableText
                    mt={'$8'}
                    textAlign={'center'}
                    fontSize={'$9'}
                    fontWeight={'700'}
                    $shorter={{
                      mt: '$5'
                    }}
                  >
                    {to?.name}
                  </SizableText>
                  <SizableText
                    mt={'$5'}
                    textAlign={'center'}
                    fontSize={'$6'}
                    color={'$primary'}
                    $shorter={{
                      mt: '$3'
                    }}
                  >
                    @{to?.name.toLowerCase()}
                  </SizableText>
                  <SizableText
                    mt={'$6'}
                    textAlign={'center'}
                    fontSize={'$3'}
                    theme={'alt1'}
                    fontWeight={'400'}
                    $shorter={{
                      mt: '$4'
                    }}
                  >
                    Aooarels, Footwears, Sneakers, Boots, Shoes
                  </SizableText>
                  <YStack
                    mt={'$7'}
                    gap={'$3.5'}
                    $shorter={{
                      mt: '$5'
                    }}
                  >
                    <SendButton
                      height={'$5'}
                      borderRadius={'$6'}
                      iconHeight={12}
                      blackIcon
                      onPress={() => setCurrentScreen(['qr-amount', 1, 'Send'])}
                    />
                    <GradientButton
                      height={'$5'}
                      borderRadius={'$6'}
                      onPress={() => setCurrentScreen(['qr-amount', 1, 'Request'])}
                    >
                      <SizableText
                        size={'$5'}
                        fontWeight={'700'}
                        color={resolvedTheme === 'dark' ? '$color2' : '$color12'}
                      >
                        Request
                      </SizableText>
                    </GradientButton>
                    <Button
                      height={'$5'}
                      br={'$6'}
                      bc={'$backgroundTransparent'}
                      boc={'$primary'}
                      width={'100%'}
                      $shorter={{
                        py: '$5',
                        br: '$7'
                      }}
                      onPress={() => setShowProfileModal(true)}
                    >
                      <SizableText size={'$5'} fontWeight={'700'}>
                        + Favorite
                      </SizableText>
                    </Button>
                  </YStack>
                </YStack>
                <Dialog.Close asChild displayWhenAdapted>
                  <Button
                    size="$2.5"
                    circular
                    bg={'unset'}
                    pos={'absolute'}
                    bottom={'$-9'}
                  >
                    <IconClose opacity={0.5} />
                  </Button>
                </Dialog.Close>
              </YStack>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </Theme>
      <ProfileModal
        showModal={showProfileModal}
        setShowModal={setShowProfileModal}
        tag={to}
        setCurrentScreen={setCurrentScreen}
      />
    </>
  )
}