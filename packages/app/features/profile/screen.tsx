// External libs & UI
import { ChevronLeft, ChevronRight, Upload } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useState } from 'react'
import {
  BlurStack,
  Button,
  Card,
  H2,
  Image,
  LinkableButton,
  Paragraph,
  Spinner,
  Stack,
  Text,
  XStack,
  YStack,
  Link,
  useMedia,
} from '@my/ui'

// Internal
import { GradientOverlay } from 'app/components/GradientOverlay'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useProfileScreenParams } from 'app/routers/params'
import {
  IconYoutube,
  IconDiscord,
  IconSpotify,
  IconXLogo,
  IconTelegramLogo,
} from 'app/components/icons'
import { ShareOtherProfileDialog } from './components/ShareOtherProfileDialog'

interface ProfileScreenProps {
  sendid?: number | null
}

export function ProfileScreen({ sendid: propSendid }: ProfileScreenProps) {
  const media = useMedia()
  const router = useRouter()
  const [{ sendid: paramSendid }] = useProfileScreenParams()
  const otherUserId = propSendid || Number(paramSendid)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const {
    data: otherUserProfile,
    isLoading,
    error,
  } = useProfileLookup('sendid', otherUserId?.toString() || '')

  const twitterUrl = otherUserProfile?.x_username
    ? `https://x.com/${otherUserProfile?.x_username}`
    : null

  const goBack = (): void => {
    router.back()
  }

  const openShareMenu = (): void => {
    setShareDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'} f={1} gap="$6">
        <Spinner size="large" color="$primary" />
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'} f={1} gap="$6">
        <Text theme="red" color={'$color8'}>
          {error.message}
        </Text>
      </Stack>
    )
  }

  return (
    <YStack f={1} w="100%" position="relative">
      <Card padded size={media.gtLg ? '$7' : '$3.5'} w="100%" h={428} position="relative">
        <Card.Background>
          <Image
            source={{
              uri:
                otherUserProfile?.avatar_url ??
                `https://ui-avatars.com/api.jpg?name=${otherUserProfile?.main_tag_name}&size=428`,
              width: 428,
              height: 428,
            }}
            h="100%"
            w="100%"
            filter="blur(40px)"
          />
        </Card.Background>
        <Image
          source={{
            uri:
              otherUserProfile?.avatar_url ??
              `https://ui-avatars.com/api.jpg?name=${otherUserProfile?.main_tag_name}&size=428`,
            width: 428,
            height: 428,
          }}
          h="100%"
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          right={0}
          margin="auto"
        />
        <GradientOverlay
          colors={['transparent', 'black']}
          height="100%"
          position="absolute"
          bottom={0}
          left={0}
          right={0}
        />
        <Card.Header p={0} padded={media.gtLg} jc="space-between" ai="center" fd="row">
          <BlurStack intensity={10} circular>
            <Button
              size="$3"
              circular
              bc="rgba(102, 102, 102, 0.4)"
              onPress={goBack}
              ai="center"
              jc={'center'}
              icon={<ChevronLeft size="$1.5" color="$white" />}
            />
          </BlurStack>
          <BlurStack intensity={10} circular>
            <Button
              size="$3"
              circular
              bc="rgba(102, 102, 102, 0.4)"
              onPress={openShareMenu}
              icon={<Upload size="$1" color="$white" />}
            />
          </BlurStack>
        </Card.Header>
        <Card.Footer
          padded
          size={media.gtLg ? '$7' : '$5'}
          pb={media.gtLg ? 0 : undefined}
          ai="flex-end"
          jc="space-between"
          f={1}
        >
          <YStack gap="$4">
            <XStack gap="$2" alignItems="center">
              <H2 color="$white">{otherUserProfile?.name}</H2>
            </XStack>
            <XStack gap="$2">
              {otherUserProfile?.all_tags?.map((tag) => {
                return (
                  <BlurStack
                    intensity={50}
                    key={tag}
                    p={8}
                    bc="rgba(102, 102, 102, 0.4)"
                    borderRadius={4}
                    alignSelf="flex-start"
                  >
                    <Paragraph color="$white" fontSize="$3" fontWeight="400">
                      /{tag}
                    </Paragraph>
                  </BlurStack>
                )
              })}
            </XStack>

            <Paragraph color="$white" fontSize="$4" fontWeight="400">
              {otherUserProfile?.about}
            </Paragraph>
          </YStack>
          {media.gtLg && (
            <LinkableButton
              href={{
                pathname: '/send',
                query: { recipient: otherUserProfile?.sendid, idType: 'sendid' },
              }}
              theme="green"
              height={48}
              borderRadius="$4"
              justifyContent="center"
              maw={300}
              w={'100%'}
            >
              <Button.Text
                color="$color1"
                fontSize="$4"
                fontFamily="$mono"
                fontWeight="500"
                textTransform="uppercase"
                textAlign="center"
              >
                SEND
              </Button.Text>
            </LinkableButton>
          )}
        </Card.Footer>
      </Card>

      <YStack
        paddingHorizontal="$4"
        paddingTop="$6"
        gap="$6"
        pb="$12"
        bc={'$color0'}
        {...(!media.gtLg
          ? { borderTopLeftRadius: '$6', borderTopRightRadius: '$6', mt: '$-3' }
          : {})}
      >
        {!media.gtLg && (
          <LinkableButton
            href={{
              pathname: '/send',
              query: { recipient: otherUserProfile?.sendid, idType: 'sendid' },
            }}
            theme="green"
            height={48}
            borderRadius="$4"
            justifyContent="center"
          >
            <Button.Text
              color="$color1"
              fontSize="$4"
              fontFamily="$mono"
              fontWeight="500"
              textTransform="uppercase"
              textAlign="center"
            >
              SEND
            </Button.Text>
          </LinkableButton>
        )}
        <YStack gap="$6">
          <XStack ai={'center'} jc="space-between">
            <Paragraph color="$color12" fontSize="$6" fontWeight="600">
              {otherUserProfile?.x_username && "Let's Connect"}
            </Paragraph>
            <Link
              textDecorationLine="underline"
              href={`/profile/${otherUserProfile?.sendid}/history`}
            >
              View History
            </Link>
          </XStack>
          {otherUserProfile?.x_username && (
            <Card padded size="$3" borderRadius="$4" gap="$4">
              {/* X/Twitter Link */}
              <LinkableButton
                key={`${otherUserProfile?.id}-x`}
                href={twitterUrl ?? ''}
                target="_blank"
                chromeless
                width="100%"
                pressStyle={{ opacity: 0.7 }}
                hoverStyle={{ opacity: 0.8 }}
                animation="quick"
              >
                <XStack justifyContent="space-between" alignItems="center" width="100%">
                  <XStack gap="$4" alignItems="center">
                    <XStack
                      borderRadius="$3"
                      justifyContent="center"
                      alignItems="center"
                      padding="$2"
                      bc="$black"
                    >
                      <IconXLogo size={24} color="$white" />
                    </XStack>
                    <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                      X
                    </Paragraph>
                  </XStack>
                  <XStack
                    bg="rgba(255, 255, 255, 0.10)"
                    borderRadius="$2"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <ChevronRight size="$1" color="$color12" />
                  </XStack>
                </XStack>
              </LinkableButton>

              {/* Telegram Link */}
              <LinkableButton
                key={`${otherUserProfile?.id}-telegram`}
                href="#"
                target="_blank"
                chromeless
                width="100%"
                pressStyle={{ opacity: 0.7 }}
                hoverStyle={{ opacity: 0.8 }}
                animation="quick"
              >
                <XStack justifyContent="space-between" alignItems="center" width="100%">
                  <XStack gap="$4" alignItems="center">
                    <XStack
                      borderRadius="$3"
                      justifyContent="center"
                      alignItems="center"
                      padding="$2"
                      bc="$telegramBlue"
                    >
                      <IconTelegramLogo size={24} color="$white" />
                    </XStack>
                    <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                      Telegram
                    </Paragraph>
                  </XStack>
                  <XStack
                    bg="rgba(255, 255, 255, 0.10)"
                    borderRadius="$2"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <ChevronRight size="$1" color="$color12" />
                  </XStack>
                </XStack>
              </LinkableButton>

              {/* Discord Link */}
              <LinkableButton
                key={`${otherUserProfile?.id}-discord`}
                href="#"
                target="_blank"
                chromeless
                width="100%"
                pressStyle={{ opacity: 0.7 }}
                hoverStyle={{ opacity: 0.8 }}
                animation="quick"
              >
                <XStack justifyContent="space-between" alignItems="center" width="100%">
                  <XStack gap="$4" alignItems="center">
                    <XStack
                      borderRadius="$3"
                      justifyContent="center"
                      alignItems="center"
                      padding="$2"
                      bc="$discordPurple"
                    >
                      <IconDiscord size={24} color="$white" />
                    </XStack>
                    <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                      Discord
                    </Paragraph>
                  </XStack>
                  <XStack
                    bg="rgba(255, 255, 255, 0.10)"
                    borderRadius="$2"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <ChevronRight size="$1" color="$color12" />
                  </XStack>
                </XStack>
              </LinkableButton>

              {/* Spotify Link */}
              <LinkableButton
                key={`${otherUserProfile?.id}-spotify`}
                href="#"
                target="_blank"
                chromeless
                width="100%"
                pressStyle={{ opacity: 0.7 }}
                hoverStyle={{ opacity: 0.8 }}
                animation="quick"
              >
                <XStack justifyContent="space-between" alignItems="center" width="100%">
                  <XStack gap="$4" alignItems="center">
                    <XStack
                      borderRadius="$3"
                      justifyContent="center"
                      alignItems="center"
                      padding="$2"
                      bc="$spotifyGreen"
                    >
                      <IconSpotify size={24} color="$white" />
                    </XStack>
                    <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                      Spotify
                    </Paragraph>
                  </XStack>
                  <XStack
                    bg="rgba(255, 255, 255, 0.10)"
                    borderRadius="$2"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <ChevronRight size="$1" color="$color12" />
                  </XStack>
                </XStack>
              </LinkableButton>

              {/* YouTube Link */}
              <LinkableButton
                key={`${otherUserProfile?.id}-youtube`}
                href="#"
                target="_blank"
                chromeless
                width="100%"
                pressStyle={{ opacity: 0.7 }}
                hoverStyle={{ opacity: 0.8 }}
                animation="quick"
              >
                <XStack justifyContent="space-between" alignItems="center" width="100%">
                  <XStack gap="$4" alignItems="center">
                    <XStack
                      borderRadius="$3"
                      justifyContent="center"
                      alignItems="center"
                      padding="$2"
                      bc="$youtubeRed"
                    >
                      <IconYoutube size={24} color="$white" />
                    </XStack>
                    <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                      YouTube
                    </Paragraph>
                  </XStack>
                  <XStack
                    bg="rgba(255, 255, 255, 0.10)"
                    borderRadius="$2"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <ChevronRight size="$1" color="$color12" />
                  </XStack>
                </XStack>
              </LinkableButton>
            </Card>
          )}
        </YStack>
      </YStack>

      <ShareOtherProfileDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        profile={otherUserProfile}
      />
    </YStack>
  )
}
