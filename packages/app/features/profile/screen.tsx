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

// No utility function needed as we'll use solito/link directly

export function ProfileScreen({ sendid: propSendid }: ProfileScreenProps) {
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

  // Use actual data or fallback values for profile
  return (
    <YStack f={1} w="100%" position="relative">
      {/* Profile Header Image with Gradient Overlay */}
      <Card w="100%" h={428} position="relative" zIndex={0}>
        <Card.Background>
          <Image
            src={
              otherUserProfile?.avatar_url ??
              `https://ui-avatars.com/api.jpg?name=${otherUserProfile?.main_tag_name}&size=256`
            }
            w="100%"
            h="100%"
          />
        </Card.Background>
        <GradientOverlay
          colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
          height="100%"
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          zIndex={1}
        />
        <Card.Header
          paddingTop="$4" // Reduced from $4 to $2 for better top alignment
          paddingHorizontal="$4"
          zIndex={3} // Ensure buttons are above everything
        >
          <XStack justifyContent="space-between" alignItems="center">
            <BlurStack intensity={10} circular>
              <Button
                size="$3"
                circular
                bc="rgba(0, 0, 0, 0.2)"
                onPress={goBack}
                ai="center"
                jc={'center'}
                zIndex={3}
                icon={<ChevronLeft size="$1.5" color="$primary" zIndex={3} />}
              />
            </BlurStack>
            <BlurStack intensity={10} circular>
              <Button
                size="$3"
                circular
                bc="rgba(0, 0, 0, 0.2)"
                onPress={openShareMenu}
                icon={<Upload size="$1" color="$white" zIndex={3} />}
              />
            </BlurStack>
          </XStack>
        </Card.Header>

        <Card.Footer paddingHorizontal="$4" paddingBottom="$5" gap="$4" zIndex={2} fd="column">
          <XStack gap="$2" alignItems="center">
            <H2 color="$white">{otherUserProfile?.name}</H2>
          </XStack>
          {otherUserProfile?.all_tags?.map((tag) => {
            return (
              <XStack
                key={tag}
                paddingHorizontal="$2"
                paddingVertical="$1"
                bc={'$darkGrayTextField'} // Matches image
                borderRadius="$2"
                alignSelf="flex-start" // Ensure it doesn't stretch full width
              >
                <Paragraph color="$white" fontSize="$2" fontWeight="400">
                  /{tag}
                </Paragraph>
              </XStack>
            )
          })}

          <Paragraph color="$white" fontSize="$4" fontWeight="400">
            {otherUserProfile?.about}
          </Paragraph>
        </Card.Footer>
      </Card>

      <YStack
        paddingHorizontal="$4"
        paddingTop="$6"
        gap="$6"
        pb="$12"
        borderTopLeftRadius={'$6'}
        borderTopRightRadius={'$6'}
        mt="$-3"
        bc={'$color0'}
      >
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
