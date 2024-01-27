import {
  Adapt,
  Avatar,
  Button,
  Container,
  Dialog,
  H1,
  H2,
  Image,
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
import { GradientButton, SendRequestModal } from '../send/components/modal'
import { IconClose } from 'app/components/icons'
import { SendButton } from 'app/components/layout/footer/components/SendButton'
import { QRScreen, ANIMATE_DIRECTION_RIGHT } from '../send/types'

const { useParam } = createParam<{ tag: string }>()

export function ProfileScreen() {
  const { user } = useUser()
  const [tag] = useParam('tag')
  const { data: profile, isLoading, error } = useProfileLookup(tag)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <Container>
      <YStack f={1} gap="$6">
        {error && <Text color="$orange10">{error.message}</Text>}
        {isLoading && <Spinner size="large" color="$color10" />}
        {profile ? (
          <YStack width="100%" gap="$2">
            <Avatar testID="avatar" size="$16" br="$4" gap="$2" mx="auto" $gtSm={{ mx: '0' }}>
              <Avatar.Image
                testID="avatarImage"
                accessibilityLabel={profile.name}
                accessibilityRole="image"
                accessible
                src={
                  profile.avatar_url ??
                  `https://ui-avatars.com/api.jpg?name=${profile.name ?? '??'}&size=256`
                }
              />
              <Avatar.Fallback bc="$background">??</Avatar.Fallback>
            </Avatar>
            <H1 nativeID="profileName">{profile.name}</H1>
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

function SendModal({
  profile,
  showModal,
  setShowModal,
}: {
  profile: NonNullable<ReturnType<typeof useProfileLookup>['data']>
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
          <YStack ai={'center'}>
            <YStack
              backgroundColor={'$background'}
              p={'$7'}
              borderRadius={'$10'}
              $shorter={{
                px: '$6',
                py: '$5',
              }}
            >
              <XStack jc={'space-between'}>
                <Avatar
                  width={'$12'}
                  height={'$12'}
                  borderRadius={'$6'}
                  $shorter={{
                    width: '$10',
                    height: '$10',
                  }}
                >
                  {profile.avatar_url ? (
                    <Avatar.Image src={profile.avatar_url} />
                  ) : (
                    <Avatar.Fallback>??</Avatar.Fallback>
                  )}
                </Avatar>
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
                  mt: '$5',
                }}
              >
                {profile.name}
              </SizableText>
              <SizableText
                mt={'$5'}
                textAlign={'center'}
                fontSize={'$6'}
                color={'$primary'}
                $shorter={{
                  mt: '$3',
                }}
              >
                @{profile.tag_name}
              </SizableText>
              <SizableText
                mt={'$6'}
                textAlign={'center'}
                fontSize={'$3'}
                theme={'alt1'}
                fontWeight={'400'}
                $shorter={{
                  mt: '$4',
                }}
              >
                {profile.about}
              </SizableText>
              <YStack
                mt={'$7'}
                gap={'$3.5'}
                $shorter={{
                  mt: '$5',
                }}
              >
                <SendButton
                  height={'$5'}
                  borderRadius={'$6'}
                  iconHeight={12}
                  blackIcon
                  // onPress={() =>
                  // setCurrentComponent([QRScreen.QR_AMOUNT, ANIMATE_DIRECTION_RIGHT, 'Send'])
                  // }
                />
                <GradientButton
                  height={'$5'}
                  borderRadius={'$6'}
                  // onPress={() =>
                  // setCurrentComponent([QRScreen.QR_AMOUNT, ANIMATE_DIRECTION_RIGHT, 'Request'])
                  // }
                >
                  <SizableText
                    size={'$5'}
                    fontWeight={'700'}
                    // color={resolvedTheme === 'dark' ? '$color2' : '$color12'}
                  >
                    Request
                  </SizableText>
                </GradientButton>
                <Button
                  height={'$5'}
                  br={'$6'}
                  bc={'$background05'}
                  boc={'$primary'}
                  width={'100%'}
                  $shorter={{
                    py: '$5',
                    br: '$7',
                  }}
                  // onPress={() => setShowProfileModal(true)}
                >
                  <SizableText size={'$5'} fontWeight={'700'}>
                    + Favorite
                  </SizableText>
                </Button>
              </YStack>
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
  )
}
