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
  useThemeName,
} from '@my/ui'

// Internal
import { GradientOverlay } from 'app/components/GradientOverlay'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useProfileScreenParams } from 'app/routers/params'
import { IconLinkInBio } from 'app/components/icons'
import { ShareOtherProfileDialog } from './components/ShareOtherProfileDialog'
import type { Functions } from '@my/supabase/database.types'

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
      <Card
        elevation={0}
        padded
        size={media.gtMd ? '$7' : '$3.5'}
        w="100%"
        h={428}
        position="relative"
      >
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
            filter="blur(12px)"
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
          zIndex={1}
        />
        <Card.Header p={0} padded={media.gtLg} jc="space-between" ai="center" fd="row">
          <BlurStack intensity={10} circular>
            <Button
              size="$3"
              circular
              bc="rgba(102, 102, 102, 0.4)"
              onPress={() => router.back()}
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
              onPress={() => setShareDialogOpen(true)}
              icon={<Upload size="$1" color="$white" />}
            />
          </BlurStack>
        </Card.Header>
        <Card.Footer
          padded
          size={media.gtMd ? '$7' : '$5'}
          pb={media.gtMd ? 0 : undefined}
          ai={media.gtMd ? 'flex-end' : 'flex-start'}
          jc={media.gtMd ? 'space-between' : 'flex-end'}
          f={1}
          fd={media.gtMd ? 'row' : 'column'}
          gap={media.gtMd ? '$8' : '$4'}
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
            als={media.gtMd ? 'flex-end' : 'flex-start'}
            href={{
              pathname: '/send',
              query: { recipient: otherUserProfile?.sendid, idType: 'sendid' },
            }}
            theme="green"
            height={32}
            borderRadius="$4"
            jc="center"
            maw={398}
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
        fd={media.gtMd ? 'row-reverse' : 'column'}
        als={'center'}
        jc={'center'}
        f={1}
        maw={media.gtMd ? 1042 : 509}
        width={'100%'}
      >
        <YStack gap="$4" f={1}>
          <XStack ai={'center'} jc="space-between">
            <Link
              textDecorationLine="underline"
              href={`/profile/${otherUserProfile?.sendid}/history`}
            >
              View History
            </Link>
          </XStack>
        </YStack>
        {otherUserProfile?.links_in_bio ? (
          <YStack gap="$4" f={1} miw="48%">
            <Paragraph color="$color12" fontSize="$6" fontWeight="600">
              Let&apos;s Connect
            </Paragraph>
            <LinksInBio profile={otherUserProfile} />
          </YStack>
        ) : null}
      </YStack>
      {otherUserProfile ? (
        <ShareOtherProfileDialog
          isOpen={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          profile={otherUserProfile}
        />
      ) : null}
    </YStack>
  )
}

const LinksInBio = ({ profile }: { profile: Functions<'profile_lookup'>[number] }) => {
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')
  return (
    <Card padded size="$4" px="$2" borderRadius="$4" w={'100%'} fd="column" gap="$4">
      {profile?.links_in_bio?.map((link) => {
        const fullUrl = `https://${link.domain}${link.handle}`
        return (
          <LinkableButton
            key={`${link.domain_name}`}
            href={fullUrl}
            target="_blank"
            width="100%"
            p={'$3'}
            f={1}
            chromeless
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
            focusStyle={{ backgroundColor: 'transparent' }}
          >
            <XStack justifyContent="space-between" alignItems="center" width="100%">
              <XStack gap="$4" alignItems="center">
                <IconLinkInBio domain_name={link.domain_name} size={40} color="$white" />
                <Paragraph size={'$5'} fontWeight={600} color={'$color12'}>
                  {link.domain_name}
                </Paragraph>
              </XStack>
              <XStack
                bg={isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)'}
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
  )
}
