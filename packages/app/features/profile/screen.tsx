import {
  Adapt,
  Avatar,
  AvatarProps,
  Button,
  Container,
  Dialog,
  H1,
  H2,
  Paragraph,
  Sheet,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack,
} from '@my/ui'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useUser } from 'app/utils/useUser'
import { useState } from 'react'
import { createParam } from 'solito'
import { GradientButton } from '../send/components/modal'
import { IconClose } from 'app/components/icons'
import { TransferProvider, useTransferContext } from '../send/providers'
import { NumPad } from '../send/components/numpad'

const { useParam } = createParam<{ tag: string }>()

export function ProfileScreen() {
  const { user } = useUser()
  const [tag] = useParam('tag')
  const { data: profile, isLoading, error } = useProfileLookup(tag)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <Container>
      <YStack f={1} gap="$6">
        {error && <Text theme="error">{error.message}</Text>}
        {isLoading && <Spinner size="large" color="$color10" />}
        {profile ? (
          <YStack width="100%" gap="$2">
            <AvatarProfile profile={profile} /> <H1 nativeID="profileName">{profile.name}</H1>
            <H2 theme="alt1">@{tag}</H2>
            <Paragraph mb="$4">{profile.about}</Paragraph>
            {profile && user?.id !== profile?.id ? (
              <XStack jc="space-around" gap="$6" maxWidth={600}>
                <Button
                  f={1}
                  width={'100%'}
                  onPress={() => {
                    setShowSendModal(true)
                  }}
                  theme="accent"
                >
                  Send
                </Button>
                <Button
                  f={1}
                  width={'100%'}
                  onPress={() => {
                    console.log('Request', profile.address)
                  }}
                >
                  Request
                </Button>
              </XStack>
            ) : null}
            <SendModal
              profile={profile}
              showModal={showSendModal}
              setShowModal={setShowSendModal}
            />
          </YStack>
        ) : null}
      </YStack>
    </Container>
  )
}

type ProfileProp = NonNullable<ReturnType<typeof useProfileLookup>['data']>

function AvatarProfile({ profile, ...rest }: AvatarProps & { profile: ProfileProp }) {
  return (
    <Avatar testID="avatar" size="$8" br="$4" gap="$2" mx="auto" $gtSm={{ mx: '0' }} {...rest}>
      <Avatar.Image
        testID="avatarImage"
        accessibilityLabel={profile.name ?? '??'}
        accessibilityRole="image"
        accessible
        src={
          profile.avatar_url ??
          `https://ui-avatars.com/api.jpg?name=${profile.name ?? '??'}&size=256`
        }
      />
      <Avatar.Fallback bc="$backgroundFocus" f={1} justifyContent="center" alignItems="center">
        <SizableText size="$12">??</SizableText>
      </Avatar.Fallback>
    </Avatar>
  )
}

function SendModal({
  profile,
  showModal,
  setShowModal,
}: {
  profile: ProfileProp
  showModal: boolean
  setShowModal: (show: boolean) => void
}) {
  return (
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
          <TransferProvider>
            <SendDialog profile={profile} />
          </TransferProvider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

function SendDialog({ profile }: { profile: ProfileProp }) {
  const { currentToken, sendAmount, setSendAmount } = useTransferContext()

  return (
    <>
      <Dialog.Close asChild displayWhenAdapted>
        <Button size="$2.5" circular bg={'unset'} /* pos={'absolute'} bottom={'$-9'} */>
          <IconClose opacity={0.5} />
        </Button>
      </Dialog.Close>
      <YStack f={1} gap="$5">
        <XStack jc="space-between" ai="center">
          <XStack ai="center" gap="$2">
            <Dialog.Title>
              <SizableText size="$13" fontWeight="bold">
                Send
              </SizableText>
            </Dialog.Title>
          </XStack>
          <GradientButton
            onPress={() => {
              // setCurrentComponent(QRScreen, ANIMATE_DIRECTION_RIGHT)
            }}
            // title="Next"
          >
            Next
          </GradientButton>
        </XStack>
        <Dialog.Description>
          <XStack ai="center" gap="$5">
            <AvatarProfile profile={profile} />
            <SizableText size="$12" fontWeight="bold">
              {profile.name}
            </SizableText>
          </XStack>
          <XStack ai="center" gap="$5">
            <XStack ai="center" gap="$2">
              {currentToken?.icon}
              <SizableText size="$12" fontWeight="bold">
                {currentToken?.name}
              </SizableText>
            </XStack>
            <XStack ai="center" gap="$2">
              <SizableText size="$12" fontWeight="bold">
                {sendAmount}
              </SizableText>
              <SizableText size="$12" fontWeight="bold">
                {currentToken?.name}
              </SizableText>
            </XStack>
          </XStack>
        </Dialog.Description>
        <NumPad value={sendAmount} setValue={setSendAmount} />
      </YStack>
    </>
  )
}
