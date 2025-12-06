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
import { memo, useCallback, useMemo, useState } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { Link } from 'solito/link'
import { Platform, Share } from 'react-native'
import { ShareProfileDialog } from './ShareProfileDialog'
import { useTranslation } from 'react-i18next'

const icons = {
  account: <IconAccount color={'$primary'} $theme-light={{ color: '$gray11' }} />,
  share: <IconShare size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />,
  qrFull: <IconQRFull size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />,
}

const shadowProps = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.05,
  shadowRadius: 8,

  elevationAndroid: 7,
} as const

export const AccountHeader = memo<YStackProps>(function AccountHeader(props) {
  const { profile } = useUser()
  const hoverStyles = useHoverStyles()
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const { t } = useTranslation('account')

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

  const isVerified = useMemo(() => Boolean(profile?.verified_at), [profile?.verified_at])

  const handleSharePress = useCallback(async () => {
    if (!referralHref) return

    void Share.share({
      message: referralHref,
    }).catch(() => null)
  }, [referralHref])

  const handleOpenShareDialog = useCallback(() => {
    setIsShareDialogOpen(true)
  }, [])

  const handleCloseShareDialog = useCallback(() => {
    setIsShareDialogOpen(false)
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
  }, [avatar_url])

  return (
    <YStack gap={'$3.5'} {...props}>
      <Link href={`/profile/${profile?.send_id}`}>
        <FadeCard w={'100%'} gap={'$3.5'} br={'$5'} p={'$5'} $gtLg={{ p: '$7', gap: '$5' }}>
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
                  <Tooltip placement={'bottom'} offset={5} delay={0}>
                    <Tooltip.Content
                      enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
                      exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
                      scale={1}
                      x={0}
                      y={0}
                      opacity={1}
                      animation={[
                        'responsive',
                        {
                          opacity: {
                            overshootClamping: true,
                          },
                        },
                      ]}
                      borderWidth={1}
                      bg="$gray1"
                      {...shadowProps}
                    >
                      <Paragraph color="$gray12" size={'$4'}>
                        {t('header.verification.notVerified')}
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
              <Separator width="100%" borderColor="$gray6" />
              <ReferralLink p={0} w="100%" jc="flex-start" />
            </YStack>
          </XStack>
        </FadeCard>
      </Link>
      <Fade>
        <XStack gap={'$3.5'}>
          <Button
            {...shadowProps}
            f={1}
            py={'$5'}
            bw={0}
            h={'auto'}
            br={'$5'}
            onPress={handleSharePress}
            hoverStyle={hoverStyles}
          >
            <Button.Icon>{icons.share}</Button.Icon>
            <Button.Text size={'$5'}>{t('header.actions.invite')}</Button.Text>
          </Button>
          <Button
            {...shadowProps}
            f={1}
            py="$5"
            h="auto"
            br="$5"
            bw={0}
            hoverStyle={hoverStyles}
            onPress={handleOpenShareDialog}
          >
            <Button.Icon>{icons.qrFull}</Button.Icon>
            <Button.Text size="$5">{t('header.actions.share')}</Button.Text>
          </Button>
          <ShareProfileDialog isOpen={isShareDialogOpen} onClose={handleCloseShareDialog} />
        </XStack>
      </Fade>
    </YStack>
  )
})
