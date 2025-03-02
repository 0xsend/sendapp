import {
  Avatar,
  Button,
  isWeb,
  LinearGradient,
  LinkableButton,
  Paragraph,
  Separator,
  Theme,
  useToastController,
  XStack,
  YStack,
} from '@my/ui'
import {
  IconAccount,
  IconCopy,
  IconGear,
  IconGroup,
  IconLeaderboard,
  IconQRFull,
  IconSlash,
  IconStarOutline,
} from 'app/components/icons'
import { getReferralHref } from 'app/utils/getReferralLink'
import { useUser } from 'app/utils/useUser'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import { type PropsWithChildren, type ReactNode, useEffect, useState } from 'react'
import { useConfirmedTags } from 'app/utils/tags'
import { useUserReferralsCount } from 'app/utils/useUserReferralsCount'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { IconCoin } from 'app/components/icons/IconCoin'
import { ChevronRight } from '@tamagui/lucide-icons'

const links = [
  {
    label: 'Sendtags',
    href: '/account/sendtag',
    icon: <IconSlash size={'$1.5'} $theme-light={{ color: '$color12' }} />,
  },
  {
    label: 'Rewards',
    href: '/account/rewards',
    icon: <IconStarOutline size={'$1.5'} $theme-light={{ color: '$color12' }} />,
  },
  {
    label: 'Affiliate',
    href: '/account/affiliate',
    icon: <IconLeaderboard size={'$1.5'} $theme-light={{ color: '$color12' }} />,
  },
]

export function AccountScreen() {
  const toast = useToastController()
  const { profile } = useUser()

  const name = profile?.name
  const send_id = profile?.send_id
  const avatar_url = profile?.avatar_url
  const tags = useConfirmedTags()
  const refCode = profile?.referral_code ?? ''
  const referralHref = getReferralHref(refCode)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    const canShare = async () => {
      const canShare = await Sharing.isAvailableAsync()
      setCanShare(canShare)
    }
    canShare()
  }, [])

  const copyAndMaybeShareOnPress = async () => {
    await Clipboard.setStringAsync(referralHref)
      .then(() => toast.show('Copied your referral link to the clipboard'))
      .then(() => (canShare ? Sharing.shareAsync(referralHref).catch(() => null) : null))
      .catch(() =>
        toast.show('Something went wrong', {
          message: 'We were unable to copy your referral link to the clipboard',
          customData: {
            theme: 'red',
          },
        })
      )
  }

  return (
    <YStack
      gap={'$3.5'}
      w={'100%'}
      pb={'$3.5'}
      maxWidth={'500px'}
      marginHorizontal={'auto'}
      $gtLg={{
        gap: '$5',
        flexDirection: 'row',
        maxWidth: '1100px',
        marginHorizontal: 0,
        height: isWeb ? 'min-content' : 'auto',
      }}
    >
      <YStack
        w="100%"
        height={'75%'}
        br="$6"
        position="relative"
        $gtLg={{
          gap: '$5',
          width: '50%',
          height: 'auto',
        }}
      >
        <Avatar w={'100%'} h={'100%'} maxWidth={'100%'} maxHeight={'100%'} bc="$color2" br="$6">
          <Avatar.Image width={'100%'} height={'100%'} src={avatar_url ?? ''} />
          <Avatar.Fallback f={1} ai={'center'} theme="green_active">
            <IconAccount $theme-light={{ color: '$color12' }} />
          </Avatar.Fallback>
        </Avatar>
        <LinearGradient
          start={[0, 0]}
          end={[0, 1]}
          fullscreen
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
          zIndex={2}
          br="$6"
        >
          <XStack
            position="absolute"
            gap="$2"
            ai={'center'}
            top={'$5'}
            left={'$5'}
            p={'$2'}
            paddingRight={'$3'}
            br={'$4'}
            bc={'rgba(0,0,0, 0.25)'}
            $platform-web={{ backdropFilter: 'blur(5px)' }}
          >
            <IconCoin symbol={'SEND'} />
            <Paragraph size={'$5'} color={'$white'}>
              Send ID: {send_id}
            </Paragraph>
          </XStack>
          <YStack
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            p={'$5'}
            justifyContent="flex-end"
            gap={'$3.5'}
          >
            <Paragraph size={'$9'} $theme-light={{ color: '$white' }} fontWeight={600}>
              {name || '---'}
            </Paragraph>
            <XStack flexWrap="wrap" columnGap={'$2.5'} rowGap={'$2'}>
              {tags?.map((tag) => (
                <TagPill key={tag.name}>{tag.name}</TagPill>
              ))}
            </XStack>
            <XStack gap="$3.5">
              <LinkableButton
                href={'/account/settings'}
                theme={'green'}
                br={'$4'}
                flexBasis={'50%'}
                flexShrink={1}
                p={'$4'}
              >
                <XStack ai={'center'} gap={'$2'}>
                  <Button.Icon>
                    <IconGear size={'$1'} color={'$black'} />
                  </Button.Icon>
                  <Button.Text
                    ff={'$mono'}
                    fontWeight={'500'}
                    tt="uppercase"
                    size={'$5'}
                    color={'$black'}
                  >
                    settings
                  </Button.Text>
                </XStack>
              </LinkableButton>
              <Button
                onPress={copyAndMaybeShareOnPress}
                theme="green"
                variant={'outlined'}
                br={'$4'}
                borderColor={'$primary'}
                ai={'center'}
                flexBasis={'50%'}
                flexShrink={1}
                p={'$4'}
              >
                <XStack jc={'space-between'} gap={'$size.0.75'} ai={'center'}>
                  <Button.Icon>
                    <IconQRFull size={16} color={'$white'} $platform-web={{ cursor: 'pointer' }} />
                  </Button.Icon>
                  <Button.Text
                    ff={'$mono'}
                    fontWeight={'500'}
                    tt="uppercase"
                    size={'$5'}
                    color={'$white'}
                  >
                    share
                  </Button.Text>
                </XStack>
              </Button>
            </XStack>
          </YStack>
        </LinearGradient>
      </YStack>
      <YStack gap={'$3.5'} width="100%" $gtLg={{ gap: '$5', width: '50%' }}>
        <XStack gap={'$3.5'} $gtLg={{ gap: '$5', flexDirection: 'column' }}>
          {links.map((linkProps) => (
            <StackButton key={linkProps.label} {...linkProps} />
          ))}
        </XStack>
        <ReferralCode />
      </YStack>
    </YStack>
  )
}

const StackButton = ({ href, label, icon }: { href: string; label: string; icon: ReactNode }) => {
  const hoverStyles = useHoverStyles()

  return (
    <LinkableButton
      href={href}
      unstyled
      flexGrow={1}
      backgroundColor={'$color1'}
      borderRadius={'$6'}
      p={'$5'}
      hoverStyle={hoverStyles}
      $gtLg={{ p: '$7' }}
    >
      <XStack jc={'space-between'} ai={'center'} gap={'$2'}>
        <YStack f={1} gap={'$3.5'} ai={'center'} $gtLg={{ flexDirection: 'row' }}>
          <Theme name="green_active">
            <Button.Icon>{icon}</Button.Icon>
          </Theme>
          <Button.Text size={'$5'} color="$color12" $gtLg={{ size: '$9', fontWeight: 500 }}>
            {label}
          </Button.Text>
        </YStack>
        <ChevronRight
          size={'$1'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
          display={'none'}
          $gtLg={{ display: 'block' }}
        />
      </XStack>
    </LinkableButton>
  )
}

const TagPill = ({ children }: PropsWithChildren) => {
  return (
    <XStack
      px={'$2.5'}
      py={'$1'}
      br={'$2'}
      bc={'rgba(255,255,255, 0.1)'}
      $platform-web={{ backdropFilter: 'blur(5px)' }}
    >
      <Paragraph fontSize={'$2'} color={'$white'}>
        /{children}
      </Paragraph>
    </XStack>
  )
}

const ReferralCode = () => {
  const { data: referralsCount } = useUserReferralsCount()
  const { profile, tags } = useUser()
  const toast = useToastController()
  const referralCode = (tags?.[0]?.name || profile?.referral_code) ?? ''
  const referralHref = getReferralHref(referralCode)

  const copyOnPress = async () => {
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

  return (
    <YStack
      w={'100%'}
      bc={'$color1'}
      jc={'space-between'}
      br={'$6'}
      p={'$5'}
      gap={'$5'}
      mb={'$3.5'}
      $gtLg={{ p: '$7', gap: '$9', mb: 0 }}
    >
      <XStack ai={'center'} jc="space-between">
        <XStack gap={'$3.5'} ai={'center'}>
          <IconGroup
            size={'$1.5'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
          <Paragraph size={'$7'} color="$color12" fontWeight={500} $gtLg={{ size: '$9' }}>
            Referrals
          </Paragraph>
        </XStack>
        <Paragraph
          ff={'$mono'}
          py={'$size.0.5'}
          px={'$size.0.9'}
          borderWidth={1}
          borderColor={'$primary'}
          $theme-light={{ borderColor: '$color12' }}
          borderRadius={'$4'}
          size={'$5'}
        >
          {referralsCount ?? 0}
        </Paragraph>
      </XStack>
      <YStack gap={'$2'}>
        <XStack jc={'space-between'} ai={'center'}>
          <Paragraph size={'$5'}>{referralCode}</Paragraph>
          <Button
            chromeless
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{
              backgroundColor: 'transparent',
              borderColor: 'transparent',
            }}
            focusStyle={{ backgroundColor: 'transparent' }}
            p={0}
            height={'auto'}
            onPress={copyOnPress}
          >
            <Button.Icon>
              <IconCopy color={'$primary'} $theme-light={{ color: '$color12' }} size="$1" />
            </Button.Icon>
          </Button>
        </XStack>
        <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
        <Paragraph
          size={'$5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Referral Code
        </Paragraph>
      </YStack>
    </YStack>
  )
}
