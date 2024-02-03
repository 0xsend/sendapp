import { Adapt, Button, Dialog, DialogProps, Sheet, SizableText, XStack, YStack } from '@my/ui'
import { GradientButton } from '../send/components/modal'
import { IconClose } from 'app/components/icons'
import { AvatarProfile } from './AvatarProfile'
import { useProfileLookup } from 'app/utils/useProfileLookup'

type ProfileProp = NonNullable<ReturnType<typeof useProfileLookup>['data']>

export function SendDialog({ profile, ...props }: DialogProps & { profile: ProfileProp }) {
  // const { token, setToken } =
  return (
    <Dialog modal {...props}>
      <Adapt when="sm" platform="touch">
        <Sheet animation="medium" zIndex={200000} modal snapPoints={[100]}>
          <Sheet.Frame p={'$5'} backgroundColor={'$background'} jc={'center'}>
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
          <Dialog.Close asChild displayWhenAdapted>
            <Button size="$2.5" circular bg={'unset'} /* pos={'absolute'} bottom={'$-9'} */>
              <IconClose opacity={0.5} />
            </Button>
          </Dialog.Close>
          <YStack f={1} gap="$5">
            <XStack jc="space-between" ai="center">
              <XStack ai="center" gap="$2">
                <Dialog.Title>Send</Dialog.Title>
              </XStack>
              <GradientButton
                onPress={() => {
                  // setCurrentComponent(QRScreen, ANIMATE_DIRECTION_RIGHT)
                }}
              >
                Next
              </GradientButton>
            </XStack>
            <Dialog.Description>
              <XStack ai="center" gap="$5">
                <AvatarProfile profile={profile} />
                <SizableText fontWeight="bold">{profile.name}</SizableText>
              </XStack>
              {/* <XStack ai="center" gap="$5">
              <XStack ai="center" gap="$2">
                {currentToken?.icon}
                <SizableText fontWeight="bold">{currentToken?.name}</SizableText>
              </XStack>
              <XStack ai="center" gap="$2">
                <SizableText fontWeight="bold">{sendAmount}</SizableText>
                <SizableText fontWeight="bold">{currentToken?.name}</SizableText>
              </XStack>
            </XStack> */}
            </Dialog.Description>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
