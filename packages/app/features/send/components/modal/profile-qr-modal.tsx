import { Adapt, Button, Dialog, Sheet, SizableText, Theme, type ThemeName, YStack } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowLeft, IconClose } from 'app/components/icons'
import type { IProfileQRModalProps } from 'app/features/send/types'

export const ProfileQRModal = ({ showModal, setShowModal, to }: IProfileQRModalProps) => {
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
          <Sheet animation="medium" zIndex={200000} modal snapPoints={[100]}>
            <Sheet.Frame p={'$5'} backgroundColor={'$background05'} jc={'center'}>
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
              <YStack
                backgroundColor={'$background'}
                px={'$5'}
                py={'$7'}
                borderRadius={'$10'}
                width={'100%'}
                ai={'center'}
              >
                <SizableText textAlign={'center'} fontSize={'$9'} fontWeight={'700'}>
                  {to?.name}
                </SizableText>
                <SizableText mt={'$5'} textAlign={'center'} fontSize={'$6'} color={'$primary'}>
                  @{to?.name.toLowerCase()}
                </SizableText>
                <YStack
                  mt={'$3'}
                  maxWidth={330}
                  maxHeight={330}
                  width={'75vw'} // Will use width: '100%' when we place Image
                  height={'75vw'} // height: 'auto'
                  backgroundColor={'$primary'}
                />
                <Dialog.Close asChild displayWhenAdapted>
                  <Button size="$2.5" circular bg={'unset'} pos={'absolute'} top={'$7'} left={'$5'}>
                    <IconArrowLeft />
                  </Button>
                </Dialog.Close>
              </YStack>
              <Dialog.Close asChild displayWhenAdapted>
                <Button size="$2.5" circular bg={'unset'} pos={'absolute'} bottom={'$-9'}>
                  <IconClose opacity={0.5} />
                </Button>
              </Dialog.Close>
            </YStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </Theme>
  )
}
