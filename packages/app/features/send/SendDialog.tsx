import {
  Adapt,
  Button,
  Container,
  Dialog,
  type DialogProps,
  Sheet,
  SizableText,
  XStack,
  YStack,
  useMedia,
} from '@my/ui'
import { IconClose } from 'app/components/icons'
import { AvatarProfile } from '../profile/AvatarProfile'
import type { useProfileLookup } from 'app/utils/useProfileLookup'
import { Provider } from 'app/provider'
import { SendForm } from './SendForm'

export type ProfileProp = NonNullable<ReturnType<typeof useProfileLookup>['data']>

export function SendDialog({ profile, ...props }: DialogProps & { profile: ProfileProp }) {
  const media = useMedia()
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
          fullscreen={media.sm}
          maxHeight={media.sm ? '100%' : 600}
          minHeight={media.sm ? '100%' : 600}
        >
          <Container testID="sendDialogContainer">
            <YStack f={1} gap="$5">
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap="$2">
                  <Dialog.Title>Send</Dialog.Title>
                </XStack>
                <Dialog.Close asChild displayWhenAdapted>
                  <Button size="$2.5" circular bg={'unset'}>
                    <IconClose opacity={0.5} />
                  </Button>
                </Dialog.Close>
              </XStack>
              <Dialog.Description>
                <YStack ai="center" gap="$5">
                  <AvatarProfile profile={profile} />
                  <SizableText fontWeight="bold">{profile.name}</SizableText>
                </YStack>
              </Dialog.Description>
              <Provider>
                <SendForm profile={profile} />
              </Provider>
            </YStack>
          </Container>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
