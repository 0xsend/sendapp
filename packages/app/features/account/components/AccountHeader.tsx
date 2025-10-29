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
  IconBadgeCheckSolid,
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
        <IconBadgeCheckSolid
          size={'$1.5'}
          mih={'$1.5'}
          miw={'$1.5'}
          color={'$primary'}
          $theme-light={{ color: '$color12' }}
        />
      )
    }

    return <IconInfoCircle color={'$error'} size={'$1.5'} br={9999} />
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
          <XStack gap={'$3.5'}>
            <Avatar size={'$7'} br={'$4'}>
              {avatarContent}
            </Avatar>

            <YStack jc={'space-between'} f={1}>
              <XStack ai="center" gap="$2">
                <Paragraph size={'$8'} fontWeight={600} numberOfLines={1}>
                  {name || '---'}
                </Paragraph>
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
                    <Tooltip.Trigger
                      onPress={(e) => {
                        if (isVerified) {
                          return
                        }
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <VerificationIcon />
                    </Tooltip.Trigger>
                  </Tooltip>
                ) : (
                  <VerificationIcon />
                )}
              </XStack>
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
