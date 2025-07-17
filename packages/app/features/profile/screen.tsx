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
import { IconSocial } from 'app/components/icons'
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

  // Helper function to get platform background colors
  const getPlatformColor = (domain_name: string): string => {
    switch (domain_name) {
      case 'X':
        return '$black'
      case 'Telegram':
        return '$telegramBlue'
      case 'Discord':
        return '$discordPurple'
      case 'YouTube':
        return '$youtubeRed'
      case 'Instagram':
        return '$instagramGradient'
      case 'TikTok':
        return '$white'
      case 'GitHub':
        return '$white'
      default:
        return '$gray8'
    }
  }

  // Helper function to get platform display names
  const getPlatformDisplayName = (domain_name: string): string => {
    switch (domain_name) {
      case 'X':
        return 'X'
      case 'YouTube':
        return 'YouTube'
      default:
        return domain_name
    }
  }

  const socialLinks = otherUserProfile?.social_links || []

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
          ai={media.gtLg ? 'flex-end' : 'flex-start'}
          jc={media.gtLg ? 'space-between' : 'flex-end'}
          f={1}
          fd={media.gtLg ? 'row' : 'column'}
          gap="$4"
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

          <LinkableButton
            als={media.gtLg ? 'flex-end' : 'center'}
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
              color="$black"
              fontSize="$4"
              fontFamily="$mono"
              fontWeight="500"
              textTransform="uppercase"
              textAlign="center"
            >
              SEND
            </Button.Text>
          </LinkableButton>
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
        <YStack gap="$6">
          <XStack ai={'center'} jc="space-between">
            <Paragraph color="$color12" fontSize="$6" fontWeight="600">
              {socialLinks.length > 0 && "Let's Connect"}
            </Paragraph>
            <Link
              textDecorationLine="underline"
              href={`/profile/${otherUserProfile?.sendid}/history`}
            >
              View History
            </Link>
          </XStack>
          {socialLinks.length > 0 && (
            <Card padded size="$3" borderRadius="$4" gap="$4">
              {socialLinks.map((link) => {
                const fullUrl = `https://${link.domain}${link.handle}`
                return (
                  <LinkableButton
                    key={`${otherUserProfile?.id}-${link.domain_name}`}
                    href={fullUrl}
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
                          bc={getPlatformColor(link.domain_name)}
                        >
                          <IconSocial domain_name={link.domain_name} size={24} color="$white" />
                        </XStack>
                        <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                          {getPlatformDisplayName(link.domain_name)}
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
                )
              })}
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
