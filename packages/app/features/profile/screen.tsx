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
  useMedia,
  useThemeName,
  styled,
  useSafeAreaInsets,
  Link,
  Anchor,
  isWeb,
  PrimaryButton,
} from '@my/ui'

// Internal
import { GradientOverlay } from 'app/components/GradientOverlay'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useProfileScreenParams } from 'app/routers/params'
import { IconLinkInBio } from 'app/components/icons'
import { ShareOtherProfileDialog } from './components/ShareOtherProfileDialog'
import type { Functions } from '@my/supabase/database.types'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { sendTokenAddress } from '@my/wagmi'
import { baseMainnet } from '@my/wagmi'
import { parseUnits } from 'viem'
import { type allCoins, type allCoinsDict, coinsDict } from 'app/data/coins'
import { IconFYSI } from 'app/components/icons/IconFYSI'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useLink } from 'solito/link'

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
    isLoading: isLoadingProfile,
    error,
  } = useProfileLookup('sendid', otherUserId?.toString() || '')
  const linkProps = useLink({
    href: {
      pathname: isWeb ? '/send' : '/send/form',
      query: {
        recipient: otherUserProfile?.sendid,
        idType: 'sendid',
        sendToken: sendTokenAddress[baseMainnet.id],
      },
    },
  })

  const safeAreaInsets = useSafeAreaInsets()

  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()

  const isLoading = isLoadingProfile || isLoadingTokenPrices

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

  if (error || !otherUserProfile) {
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'} f={1} gap="$6">
        <Text theme="red" color={'$color8'}>
          {error?.message || 'Profile not found'}
        </Text>
      </Stack>
    )
  }

  return (
    <>
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
        <Card.Header
          p={0}
          pt={safeAreaInsets.top}
          padded={media.gtMd}
          jc="space-between"
          ai="center"
          fd="row"
        >
          <BlurStack intensity={10} circular overflow="hidden">
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
          <BlurStack intensity={10} circular overflow="hidden">
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
          size={media.gtMd ? '$7' : '$5'}
          pb={media.gtMd ? 0 : undefined}
          ai={media.gtMd ? 'flex-end' : 'flex-start'}
          jc={media.gtMd ? 'space-between' : 'flex-end'}
          f={1}
          flexDirection={media.gtMd ? 'row' : 'column'}
          gap={media.gtMd ? '$8' : '$4'}
        >
          <YStack gap="$4">
            <XStack gap="$2" alignItems="center">
              <H2 color="$white">{otherUserProfile?.name}</H2>
            </XStack>
            <XStack gap="$2" flexWrap="wrap" maw="100%">
              {otherUserProfile?.all_tags?.map((tag) => {
                return (
                  <BlurStack
                    intensity={10}
                    key={tag}
                    p={8}
                    bc="rgba(102, 102, 102, 0.4)"
                    borderRadius={4}
                    alignSelf="flex-start"
                    overflow="hidden"
                  >
                    <Paragraph color="$white" fontSize="$3" fontWeight="400">
                      /{tag}
                    </Paragraph>
                  </BlurStack>
                )
              })}
            </XStack>
            {otherUserProfile?.about && (
              <Paragraph color="$white" fontSize="$4" fontWeight="400">
                {otherUserProfile?.about}
              </Paragraph>
            )}
          </YStack>
          <PrimaryButton als={media.gtMd ? 'flex-end' : 'flex-start'} maw={398} {...linkProps}>
            <PrimaryButton.Text>SEND</PrimaryButton.Text>
          </PrimaryButton>
        </Card.Footer>
      </Card>
      {media.gtMd ? (
        <XStack
          maw={1042}
          display="flex"
          fd={'row-reverse'}
          px="$4"
          pt="$6"
          pb="$12"
          gap="$4"
          bc={'$color0'}
          als={'center'}
          jc={'center'}
          width={'100%'}
        >
          <YStack gap="$4" f={1} w="100%">
            <XStack ai={'center'} jc="space-between">
              <Paragraph color="$color12" fontSize="$6" fontWeight="600">
                Send Vibes
              </Paragraph>
              <Link
                textDecorationLine="underline"
                href={`/profile/${otherUserProfile?.sendid}/history`}
              >
                View History
              </Link>
            </XStack>
            <Vibes profile={otherUserProfile} tokenPrices={tokenPrices} />
          </YStack>
          {otherUserProfile?.links_in_bio ? (
            <YStack gap="$4" f={1} w="100%">
              <Paragraph color="$color12" fontSize="$6" fontWeight="600">
                Let&apos;s Connect
              </Paragraph>
              <LinksInBio profile={otherUserProfile} />
            </YStack>
          ) : null}
        </XStack>
      ) : (
        <YStack
          maw={509}
          display="flex"
          fd={'column'}
          px="$4"
          pt="$6"
          gap="$4"
          bc={'$color0'}
          als={'center'}
          jc={'center'}
          width={'100%'}
        >
          <YStack gap="$4" f={1} w="100%">
            <XStack ai={'center'} jc="space-between">
              <Paragraph color="$color12" fontSize="$6" fontWeight="600">
                Send Vibes
              </Paragraph>
              <Link
                textDecorationLine="underline"
                href={`/profile/${otherUserProfile?.sendid}/history`}
              >
                View History
              </Link>
            </XStack>
            <Vibes profile={otherUserProfile} tokenPrices={tokenPrices} />
          </YStack>
          {otherUserProfile?.links_in_bio ? (
            <YStack gap="$4" f={1} w="100%">
              <Paragraph color="$color12" fontSize="$6" fontWeight="600">
                Let&apos;s Connect
              </Paragraph>
              <LinksInBio profile={otherUserProfile} />
            </YStack>
          ) : null}
        </YStack>
      )}

      {otherUserProfile ? (
        <ShareOtherProfileDialog
          isOpen={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          profile={otherUserProfile}
        />
      ) : null}
    </>
  )
}

const VibeButton = styled(LinkableButton, {
  elevation: 1,
  br: '$6',
  ai: 'center',
  jc: 'space-around',
  w: 'auto',
  maw: 100,
  h: 'auto',
  gap: '$2',
  f: 1,
  fd: 'column',
  p: '$3.5',
})

const Vibe = ({
  amount,
  sendToken,
  note,
  children,
  profile,
}: {
  amount: bigint
  sendToken: keyof allCoinsDict
  note: string
  children: React.ReactNode
  profile: Functions<'profile_lookup'>[number]
}) => {
  const hoverStyle = useHoverStyles()
  return (
    <VibeButton
      href={{
        pathname: '/send/confirm',
        query: {
          recipient: profile?.main_tag_name ? profile?.main_tag_name : (profile?.sendid ?? ''),
          idType: profile?.main_tag_name ? 'tag' : 'sendid',
          sendToken,
          amount: amount.toString(),
          note: encodeURIComponent(note),
        },
      }}
      bc="$color1"
      hoverStyle={hoverStyle}
    >
      {children}
    </VibeButton>
  )
}

const Vibes = ({
  profile,
  tokenPrices,
}: {
  profile: Functions<'profile_lookup'>[number]
  tokenPrices: Record<allCoins[number]['token'], number> | undefined
}) => {
  const media = useMedia()
  const dollarToTokenAmount = ({
    amount,
    tokenPrice,
    token,
  }: {
    amount: number
    tokenPrice: number
    token: keyof allCoinsDict
  }) => {
    const coinData = coinsDict[token]

    if (tokenPrice <= 0 || !coinData) {
      return 0n
    }

    const tokenAmount = amount / tokenPrice
    const decimals = coinData.decimals || 18

    // Round to 2 decimal places
    const roundedTokenAmount = Math.floor(tokenAmount * 100) / 100

    // Convert to the proper bigint representation
    // For example: 250.00 SEND tokens = 250 * 10^18 = 250000000000000000000n
    return parseUnits(roundedTokenAmount.toFixed(2), decimals)
  }

  const isDark = useThemeName()?.startsWith('dark')
  const sendTokenPrice = tokenPrices?.[sendTokenAddress[baseMainnet.id]] ?? 0
  return (
    <XStack jc="flex-start" gap={'$2'} p={2} overflowX={media.gtMd ? 'visible' : 'scroll'}>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 1,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="😊"
        profile={profile}
      >
        <Button.Text size={media.xs ? '$8' : '$9'} lineHeight={34}>
          😊
        </Button.Text>
        <Paragraph size={'$3'}>$1</Paragraph>
      </Vibe>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 2,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="🔥"
        profile={profile}
      >
        <Button.Text size={media.xs ? '$8' : '$9'} lineHeight={34}>
          🔥
        </Button.Text>
        <Paragraph size={'$3'}>$2</Paragraph>
      </Vibe>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 3,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="💯"
        profile={profile}
      >
        <Button.Text size={media.xs ? '$8' : '$9'} lineHeight={34}>
          💯
        </Button.Text>
        <Paragraph size={'$3'}>$3</Paragraph>
      </Vibe>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 4,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="🚀"
        profile={profile}
      >
        <Button.Text size={media.xs ? '$8' : '$9'} lineHeight={34}>
          🚀
        </Button.Text>
        <Paragraph size={'$3'}>$4</Paragraph>
      </Vibe>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 5,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="FYSI"
        profile={profile}
      >
        <Button.Icon>
          <IconFYSI size={'$3'} color={isDark ? '$primary' : '$color12'} />
        </Button.Icon>
        <Paragraph size={'$3'}>$5</Paragraph>
      </Vibe>
    </XStack>
  )
}

const LinksInBio = ({ profile }: { profile: Functions<'profile_lookup'>[number] }) => {
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')
  return (
    <Card elevation={1} padded size="$4" px="$2" borderRadius="$4" gap="$4">
      {profile?.links_in_bio?.map((link) => {
        const fullUrl = `https://${link.domain}${link.handle}`
        return (
          <Anchor
            key={`lets-connect-${link.domain}${link.handle}`}
            href={fullUrl}
            target="_blank"
            width="100%"
            f={1}
            textDecorationLine="none"
          >
            <XStack
              p={'$3'}
              f={1}
              width="100%"
              h="100%"
              justifyContent="space-between"
              alignItems="center"
            >
              <XStack gap="$4" alignItems="center">
                <IconLinkInBio domain_name={link.domain_name} size={24} color="$white" />
                <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
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
          </Anchor>
        )
      })}
    </Card>
  )
}
