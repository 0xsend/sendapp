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
import { IconClose, IconQRCode, IconShare } from "app/components/icons"
import { IProfileModalProps } from "app/features/send/types"
import { ProfileQRModal } from "./profile-qr-modal"
import { useSubScreenContext } from "app/features/send/providers"

export const ProfileModal = ({
  showModal,
  setShowModal,
  tag,
}: IProfileModalProps) => {
  const { setCurrentComponent } = useSubScreenContext()
  const [showProfileQRModal, setShowProfileQRModal] = useState(false)

  const { resolvedTheme } = useThemeSetting()

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
                <YStack backgroundColor={'$background'} p={'$7'} borderRadius={'$10'}>
                  <XStack jc={'center'} mt={'-30%'}>
                    <Image
                      source={{ uri: tag?.avatar }}
                      width={'$12'}
                      height={'$12'}
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
                  >
                    {tag?.name}
                  </SizableText>
                  <SizableText
                    mt={'$5'}
                    textAlign={'center'}
                    fontSize={'$6'}
                    color={'$primary'}
                  >
                    @{tag?.name.toLowerCase()}
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
                      onPress={() => setShowModal(true)}
                    >
                      <SizableText size={'$5'} fontWeight={'700'} color={'$primary'}>
                        Add as Favorite
                      </SizableText>
                    </Button>
                  </YStack>
                  <Button
                    size="$2.5"
                    circular
                    bg={'unset'}
                    pos={'absolute'}
                    top={'$5'}
                    left={'$5'}
                    onPress={() => setShowProfileQRModal(true)}
                  >
                    <IconQRCode />
                  </Button>
                  <Button
                    size="$2.5"
                    circular
                    bg={'unset'}
                    pos={'absolute'}
                    top={'$5'}
                    right={'$5'}
                    onPress={() => setCurrentComponent(['qr-share', 1])}
                  >
                    <IconShare />
                  </Button>
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
      <ProfileQRModal showModal={showProfileQRModal} setShowModal={setShowProfileQRModal} to={tag} />
    </>
  )
}