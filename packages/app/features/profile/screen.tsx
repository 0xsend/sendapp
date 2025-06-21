// External libs & UI
import { ChevronLeft, ChevronRight, Upload } from '@tamagui/lucide-icons'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import {
  Avatar,
  Button,
  Card,
  H2,
  Image,
  Paragraph,
  Spinner,
  Stack,
  Text,
  useTheme,
  XStack,
  YStack,
} from '@my/ui'

// Internal
import { GradientOverlay } from 'app/components/GradientOverlay'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useProfileScreenParams, useRootScreenParams } from 'app/routers/params'
import { useUser } from 'app/utils/useUser'
import { IconAccount, IconXLogo } from 'app/components/icons'

interface ProfileScreenProps {
  sendid?: number | null
}

// No utility function needed as we'll use solito/link directly

export function ProfileScreen({ sendid: propSendid }: ProfileScreenProps) {
  const router = useRouter()
  const [{ sendid: paramSendid }] = useProfileScreenParams()
  const otherUserId = propSendid || Number(paramSendid)
  const {
    data: otherUserProfile,
    isLoading,
    error,
  } = useProfileLookup('sendid', otherUserId?.toString() || '')
  const { user } = useUser()
  const [{ profile: profileParam }] = useRootScreenParams()
  const theme = useTheme()

  const twitterUrl = otherUserProfile?.x_username
    ? `https://x.com/${otherUserProfile?.x_username}`
    : null

  // No need for mock data, we'll use actual data directly

  const goBack = (): void => {
    router.back()
  }

  const openShareMenu = (): void => {
    // Implement share functionality
    console.log('Share profile')
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
    <YStack f={1} bg="$color1" w="100%" position="relative">
      {/* Profile Header Image with Gradient Overlay */}
      <YStack w="100%" h={428} position="relative">
        {/* <Avatar
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          width="100%"
          height="100%"
          borderRadius={0}
          overflow="hidden"
        >
          <Avatar.Image
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            objectFit="cover"
            src={otherUserProfile?.avatar_url ?? undefined}
          />
          <Avatar.Fallback backgroundColor="$color3" justifyContent="center" alignItems="center">
            <IconAccount color="$olive" />
          </Avatar.Fallback>
        </Avatar> */}
        <Image src={otherUserProfile?.avatar_url ?? undefined} w="100%" h="100%" />
        <GradientOverlay
          colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
          height="100%"
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          zIndex={1}
        />
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          paddingHorizontal="$4"
          paddingBottom="$4"
          gap="$4"
          zIndex={2}
        >
          <XStack gap="$2" alignItems="center">
            <H2 color="$white">{otherUserProfile?.name}</H2>
          </XStack>

          <XStack
            paddingHorizontal="$2"
            paddingVertical="$1"
            bg={'$color10'} // Matches image
            borderRadius="$2"
            alignSelf="flex-start" // Ensure it doesn't stretch full width
          >
            <Paragraph color="$white" fontSize="$2" fontWeight="400">
              /{otherUserProfile?.main_tag_name}
            </Paragraph>
          </XStack>

          <Paragraph color="$white" fontSize="$4" fontWeight="400">
            {otherUserProfile?.about}
          </Paragraph>
        </YStack>
      </YStack>

      {/* Top navigation bar with back button and share */}
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        paddingTop="$4" // Reduced from $4 to $2 for better top alignment
        paddingHorizontal="$4"
        zIndex={3} // Ensure buttons are above everything
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Button
            size="$3"
            p="$2"
            circular
            bg="rgba(255, 255, 255, 0.1)"
            backdropFilter="blur(52px)"
            onPress={goBack}
            icon={<ChevronLeft size="$6" color="$primary" />}
          />
          <Button
            size="$3"
            circular
            p="$2"
            bg="rgba(255, 255, 255, 0.1)"
            backdropFilter="blur(52px)"
            onPress={openShareMenu}
            icon={<Upload size="$4" color="$white" />}
          />
        </XStack>
      </YStack>

      {/* Content Below Header Image (Send Button, Social Links) */}
      <YStack paddingHorizontal="$4" paddingTop="$6" gap="$6" pb="$12">
        {/* Send Button */}
        <Button theme="green" height={48} borderRadius="$2" justifyContent="center">
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
        </Button>

        <YStack gap="$6">
          <Paragraph color="$color12" fontSize="$6" fontWeight="600">
            Let's Connect
          </Paragraph>

          <Card padding="$6" borderRadius="$4" gap="$6" bc="$color0">
            <Link key={otherUserProfile?.id} href={twitterUrl ?? ''} target="_blank">
              <Button
                chromeless
                width="100%"
                pressStyle={{ opacity: 0.7 }}
                hoverStyle={{ opacity: 0.8 }}
                animation="quick"
              >
                <XStack justifyContent="space-between" alignItems="center" width="100%">
                  <XStack gap="$4" alignItems="center">
                    <IconXLogo
                      size={'$2'}
                      $theme-dark={{ color: '$primary' }}
                      $theme-light={{ color: '$color12' }}
                    />
                  </XStack>
                  <XStack
                    p="$1"
                    bg="rgba(255, 255, 255, 0.10)"
                    borderRadius="$2"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <ChevronRight size="$1.5" color="$white" />
                  </XStack>
                </XStack>
              </Button>
            </Link>
          </Card>
        </YStack>
      </YStack>
    </YStack>
  )
}
