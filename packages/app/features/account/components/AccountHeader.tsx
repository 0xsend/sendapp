import {
  Avatar,
  Button,
  Fade,
  FadeCard,
  Paragraph,
  Separator,
  Tooltip,
  XStack,
  YStack,
  Theme,
} from '@my/ui'
import type { YStackProps } from 'tamagui'
import {
  IconAccount,
  IconCheckCircle,
  IconInfoCircle,
  IconQRFull,
  IconShare,
} from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { ReferralLink } from 'app/components/ReferralLink'
import { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { Link } from 'solito/link'
import { Platform, Share } from 'react-native'
import { ChevronRight } from '@tamagui/lucide-icons'

const ShareProfileDialog = lazy(() =>
  import('./ShareProfileDialog').then((module) => ({ default: module.ShareProfileDialog }))
)

export const AccountHeader = memo<YStackProps>(function AccountHeader(props) {
  const { profile, distributionShares } = useUser()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const hoverStyles = useHoverStyles()

  const avatar_url = useMemo(() => profile?.avatar_url, [profile?.avatar_url])
  const name = useMemo(() => profile?.name, [profile?.name])
  const referralCode = useMemo(
    () => profile?.main_tag?.name || profile?.referral_code,
    [profile?.main_tag?.name, profile?.referral_code]
  )
  const referralHref = useMemo(
    () => (referralCode ? `https://send.app?referral=${referralCode}` : ''),
    [referralCode]
  )

  const icons = useMemo(
    () => ({
      account: <IconAccount color={'$primary'} $theme-light={{ color: '$color12' }} />,
      share: <IconShare size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />,
      qrFull: <IconQRFull size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />,
    }),
    []
  )

  const isVerified = useMemo(
    () => Boolean(distributionShares[0] && distributionShares[0].amount > 0n),
    [distributionShares]
  )

  const handleSharePress = useCallback(async () => {
    if (!referralHref) return

    void Share.share({
      message: referralHref,
    }).catch(() => null)
  }, [referralHref])

  const handleOpenDialog = useCallback(() => {
    setShareDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setShareDialogOpen(false)
  }, [])

  // Verification status icon component
  const VerificationIcon = () => {
    if (isVerified) {
      return (
        <IconCheckCircle
          size={'$1.5'}
          color={'$primary'}
          br={9999}
          bc={'$color0'}
          $theme-light={{ bc: '$color12' }}
        />
      )
    }

    return (
      <Theme name="red">
        <IconInfoCircle bc={'$color0'} color={'$color8'} size={'$1.5'} br={9999} />
      </Theme>
    )
  }

  const avatarContent = useMemo(() => {
    if (Platform.OS === 'android' && !avatar_url) {
      return (
        <XStack f={1} bc="$color2">
          {icons.account}
        </XStack>
      )
    }
    return (
      <>
        <Avatar.Image src={avatar_url ?? ''} />
        <Avatar.Fallback f={1} ai={'center'} bc="$color2">
          {icons.account}
        </Avatar.Fallback>
      </>
    )
  }, [avatar_url, icons.account])

  return (
    <YStack gap={'$3.5'} {...props}>
      <Link href={`/profile/${profile?.send_id}`}>
        <FadeCard
          w={'100%'}
          gap={'$3.5'}
          br={'$5'}
          p={'$5'}
          $gtLg={{ p: '$7', gap: '$5' }}
          elevation={1}
        >
          <ChevronRight
            position="absolute"
            right={'$4'}
            top={'$4'}
            size={'$1'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          />
          <XStack gap={'$3.5'}>
            <XStack position="relative">
              {!isVerified ? (
                <Tooltip placement={'bottom'} delay={0}>
                  <Tooltip.Content
                    enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
                    exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
                    scale={1}
                    x={0}
                    y={0}
                    opacity={1}
                    animation={[
                      'quick',
                      {
                        opacity: {
                          overshootClamping: true,
                        },
                      },
                    ]}
                    boc={'$error'}
                    borderWidth={1}
                    $theme-dark={{ bc: '$black' }}
                    $theme-light={{ bc: '$white' }}
                  >
                    <Tooltip.Arrow borderColor={'$error'} bw={4} />
                    <Paragraph
                      size={'$4'}
                      $theme-dark={{ col: '$white' }}
                      $theme-light={{ col: '$black' }}
                    >
                      Not verified
                    </Paragraph>
                  </Tooltip.Content>
                  <Tooltip.Trigger>
                    <XStack position="relative" onPress={(e) => e.preventDefault()}>
                      <Avatar size={'$7'} br={'$4'}>
                        {avatarContent}
                      </Avatar>
                    </XStack>
                    <XStack
                      position="absolute"
                      top={-10}
                      right={-10}
                      ai="center"
                      jc="center"
                      zIndex={10}
                      elevation={'$0.75'}
                      br={9999}
                    >
                      <VerificationIcon />
                    </XStack>
                  </Tooltip.Trigger>
                </Tooltip>
              ) : (
                <XStack position="relative">
                  <Avatar size={'$7'} br={'$4'}>
                    {avatarContent}
                  </Avatar>
                  <XStack
                    position="absolute"
                    top={-10}
                    right={-10}
                    ai="center"
                    jc="center"
                    zIndex={10}
                  >
                    <VerificationIcon />
                  </XStack>
                </XStack>
              )}
            </XStack>

            <YStack jc={'space-between'} f={1}>
              <Paragraph size={'$8'} fontWeight={600} numberOfLines={1}>
                {name || '---'}
              </Paragraph>
              <Separator width="100%" borderColor="$decay" />
              <ReferralLink p={0} w="100%" jc="flex-start" />
            </YStack>
          </XStack>
        </FadeCard>
      </Link>
      <Fade>
        <XStack gap={'$3.5'}>
          <Button
            elevation={'$0.75'}
            f={1}
            py={'$5'}
            bw={0}
            h={'auto'}
            br={'$5'}
            onPress={handleSharePress}
            hoverStyle={hoverStyles}
          >
            <Button.Icon>{icons.share}</Button.Icon>
            <Button.Text size={'$5'}>Invite Friends</Button.Text>
          </Button>
          <Button
            elevation={'$0.75'}
            f={1}
            py={'$5'}
            h={'auto'}
            br={'$5'}
            bw={0}
            hoverStyle={hoverStyles}
            onPress={handleOpenDialog}
          >
            <Button.Icon>{icons.qrFull}</Button.Icon>
            <Button.Text size={'$5'}>Share Profile</Button.Text>
          </Button>
        </XStack>
      </Fade>
      {shareDialogOpen && (
        <Suspense fallback={null}>
          <ShareProfileDialog isOpen={shareDialogOpen} onClose={handleCloseDialog} />
        </Suspense>
      )}
    </YStack>
  )
})
