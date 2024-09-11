import {
  Avatar,
  Paragraph,
  XStack,
  YStack,
  Button,
  useToastController,
  TooltipSimple,
  useMedia,
  Theme,
  Heading,
  LinkableButton,
  LinearGradient,
} from '@my/ui'
import {
  IconAccount,
  IconCopy,
  IconStarOutline,
  IconGear,
  IconShare,
  IconBadgeCheck,
  IconArrowRight,
  IconQRFull,
  IconLeaderboard,
} from 'app/components/icons'
import { getReferralHref } from 'app/utils/getReferralLink'
import { useUser } from 'app/utils/useUser'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import { useRootScreenParams } from 'app/routers/params'
import { type PropsWithChildren, type ReactNode, useEffect, useState } from 'react'
import { useConfirmedTags } from 'app/utils/tags'
import { useUserReferralsCount } from 'app/utils/useUserReferralsCount'

export function AccountScreen() {
  const media = useMedia()
  const toast = useToastController()
  const { profile } = useUser()
  const { referralsCount } = useUserReferralsCount()

  const name = profile?.name
  const send_id = profile?.send_id
  const avatar_url = profile?.avatar_url
  const tags = useConfirmedTags()
  const refCode = profile?.referral_code ?? ''
  const referralHref = getReferralHref(refCode)
  const [queryParams, setRootParams] = useRootScreenParams()
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    const canShare = async () => {
      const canShare = await Sharing.isAvailableAsync()
      setCanShare(canShare)
    }
    canShare()
  }, [])

  const shareOrCopyOnPress = async () => {
    if (canShare) {
      return await Sharing.shareAsync(referralHref)
    }

    await Clipboard.setStringAsync(referralHref)
      .then(() => toast.show('Copied your referral link to the clipboard'))
      .catch(() =>
        toast.show('Something went wrong', {
          message: 'We were unable to copy your referral link to the clipboard',
          customData: {
            theme: 'red',
          },
        })
      )
  }

  const avatarWidth = (() => {
    switch (true) {
      case media.xxs:
        return 325
      case media.xs:
        return 360
      default:
        return 480
    }
  })()

  const links = [
    {
      label: 'Sendtags',
      href: '/account/sendtag',
      icon: <IconBadgeCheck size={22} $theme-light={{ color: '$color12' }} />,
    },
    {
      label: 'Rewards',
      href: '/account/rewards',
      icon: <IconStarOutline size={20} $theme-light={{ color: '$color12' }} />,
    },
    {
      label: 'Leaderboard',
      href: '/leaderboard',
      icon: <IconLeaderboard size={20} $theme-light={{ color: '$color12' }} />,
    },
  ]

  return (
    <YStack
      gap={'$size.1.5'}
      width={'100%'}
      pb={'$size.1.5'}
      pt={'$size.3.5'}
      $gtMd={{ flexDirection: 'row', ai: 'stretch', alignSelf: 'flex-start' }}
      $gtLg={{ pt: 0 }}
      ai="center"
    >
      <YStack bg={'$color1'} br={'$6'} maxWidth={avatarWidth}>
        <YStack ai={'flex-start'} h="100%">
          <YStack pos={'relative'}>
            <Avatar size={avatarWidth} btlr={'$6'} btrr={'$6'} bc="$color2">
              <Avatar.Image accessibilityLabel="" src={avatar_url ?? ''} />
              <Avatar.Fallback f={1} ai={'center'} theme="green_active">
                <IconAccount size={avatarWidth * 0.9} c$theme-light={{ color: '$color12' }} />
              </Avatar.Fallback>
            </Avatar>
            <LinearGradient
              start={[0, 1]}
              end={[0, 0]}
              width={'100%'}
              height={'$9'}
              colors={['$color1', '$color1', 'transparent']}
              pos={'absolute'}
              pointerEvents={'none'}
              b={0}
              zIndex={2}
            />
            <XStack
              zIndex={3}
              pos={'absolute'}
              bottom={'0'}
              px={'$size.1'}
              ai={'center'}
              jc={'space-between'}
              w={'100%'}
              $gtXs={{ px: '$size.3.5' }}
            >
              <Heading fontSize={'$10'} fontWeight={'900'} color={'$color12'}>
                {name ? name.toUpperCase() : '---'}
              </Heading>
            </XStack>
          </YStack>
          <YStack
            $gtXs={{ p: '$size.3.5' }}
            p={'$size.1'}
            pt={'$size.0.9'}
            jc={'space-between'}
            f={1}
            width={'100%'}
          >
            <YStack>
              <XStack gap="$size.0.75">
                <Paragraph color={'$color10'} size="$6">
                  Send ID:
                </Paragraph>
                <Paragraph size="$6">{send_id}</Paragraph>
              </XStack>
              <YStack
                flexDirection="row"
                gap={'$size.0.75'}
                flexWrap="wrap"
                flexGrow={1}
                mt={'$size.0.9'}
              >
                {tags?.map((tag) => (
                  <TagPill key={tag.name}>{tag.name}</TagPill>
                ))}
              </YStack>
            </YStack>

            <XStack gap="$size.0.9" mt={'$size.1.5'}>
              <LinkableButton
                href={media.lg ? '/account?nav=settings' : '/account/settings/edit-profile'}
                // on smaller screens, we don't want to navigate to the settings screen but open bottom sheet
                {...(media.lg
                  ? {
                      onPress: (e) => {
                        if (media.lg) {
                          e.preventDefault()
                          setRootParams(
                            { ...queryParams, nav: 'settings' },
                            { webBehavior: 'replace' }
                          )
                        }
                      },
                    }
                  : {})}
                theme={'green'}
                borderRadius={'$3'}
                flexBasis={'50%'}
                flexShrink={1}
              >
                <XStack jc={'space-between'} ai={'center'} gap={'$size.0.75'}>
                  <Button.Icon>
                    <IconGear size={20} />
                  </Button.Icon>
                  <Button.Text fontWeight={600} tt={'uppercase'}>
                    Settings
                  </Button.Text>
                </XStack>
              </LinkableButton>
              <LinkableButton
                href={tags?.[0] ? `/${tags[0].name}` : `/profile/${send_id}`}
                theme="green"
                variant={'outlined'}
                borderRadius={'$3'}
                flexBasis={'50%'}
                flexShrink={1}
                borderColor={'$primary'}
              >
                <XStack jc={'space-between'} gap={'$size.0.75'} ai={'center'}>
                  <Button.Icon>
                    <IconQRFull size={16} color="$color12" />
                  </Button.Icon>
                  <Button.Text color="$color12" fontWeight={600} tt={'uppercase'}>
                    Share
                  </Button.Text>
                </XStack>
              </LinkableButton>
            </XStack>
          </YStack>
        </YStack>
      </YStack>

      <YStack gap={'$size.1.5'} maxWidth={avatarWidth} f={1} width="100%">
        {links.map((linkProps) => (
          <StackButton key={linkProps.label} {...linkProps} />
        ))}

        <YStack
          backgroundColor={'$color1'}
          jc={'space-between'}
          borderRadius={'$6'}
          p={'$size.1'}
          $gtXs={{ p: '$size.3.5' }}
          f={1}
        >
          <XStack ai={'center'} jc="space-between">
            <Paragraph size={'$9'} color="$color12" fontWeight={600}>
              Referrals
            </Paragraph>
            <Paragraph
              ff={'$mono'}
              py={'$size.0.5'}
              px={'$size.0.9'}
              borderWidth={1}
              borderColor={'$primary'}
              $theme-light={{ borderColor: '$color12' }}
              borderRadius={'$4'}
            >
              {referralsCount ?? 0}
            </Paragraph>
          </XStack>

          <YStack>
            <Paragraph color="$color10">Referral Code</Paragraph>
            <XStack py={'$2.5'} borderRadius={'$4'}>
              <TooltipSimple
                label={<Paragraph color="$white">{canShare ? 'Share' : 'Copy'}</Paragraph>}
              >
                <Button
                  bc={'$color0'}
                  br="$2"
                  aria-label={canShare ? 'Share' : 'Copy'}
                  f={1}
                  fd="row"
                  chromeless
                  onPress={shareOrCopyOnPress}
                  color="$color12"
                  justifyContent="space-between"
                  iconAfter={
                    <Theme name="green_Button">
                      {canShare ? (
                        <IconShare
                          size="$1"
                          col={'$background'}
                          $theme-light={{ color: '$color12' }}
                          $platform-web={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <IconCopy
                          size="$1"
                          col={'$background'}
                          $theme-light={{ color: '$color12' }}
                          $platform-web={{ cursor: 'pointer' }}
                        />
                      )}
                    </Theme>
                  }
                >
                  <Button.Text size={'$6'}>SEND.APP/{refCode}</Button.Text>
                </Button>
              </TooltipSimple>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  )
}

const StackButton = ({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: ReactNode
}) => {
  return (
    <LinkableButton
      href={href}
      unstyled
      backgroundColor={'$color1'}
      borderRadius={'$6'}
      p={'$size.1'}
      $gtXs={{ p: '$size.3.5' }}
      borderWidth={1}
      borderColor={'$color1'}
      hoverStyle={{
        borderColor: '$primary',
      }}
      $theme-light={{ hoverStyle: { borderColor: '$color12' } }}
    >
      <XStack jc={'space-between'} ai={'center'}>
        <XStack gap={'$size.0.9'} ai={'center'}>
          <Theme name="green_active">
            <Button.Icon>{icon}</Button.Icon>
          </Theme>
          <Button.Text size={'$9'} color="$color12" fontWeight={600}>
            {label}
          </Button.Text>
        </XStack>
        <Theme name="green_active">
          <IconArrowRight size={24} $theme-light={{ color: '$color' }} />
        </Theme>
      </XStack>
    </LinkableButton>
  )
}

const TagPill = ({ children }: PropsWithChildren) => {
  return (
    <Paragraph
      fontSize={'$2'}
      bg="rgba(255,255,255,.1)"
      $theme-light={{ bg: '$color2' }}
      px={'$size.0.75'}
      py={'$size.0.1'}
      borderRadius={'$1'}
    >
      /{children}
    </Paragraph>
  )
}
