import { Avatar, Button, Fade, FadeCard, Paragraph, Separator, XStack, YStack } from '@my/ui'
import type { YStackProps } from 'tamagui'
import { IconAccount, IconQRFull, IconShare } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { ReferralLink } from 'app/components/ReferralLink'
import { useEffect, useState } from 'react'
import * as Sharing from 'expo-sharing'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { ShareProfileDialog } from './ShareProfileDialog'
import { Link } from 'solito/link'

export const AccountHeader = (props: YStackProps) => {
  const { profile } = useUser()
  const avatar_url = profile?.avatar_url
  const name = profile?.name
  const referralCode = profile?.main_tag?.name || profile?.referral_code
  const referralHref = `https://send.app?referral=${referralCode}`
  const [canShare, setCanShare] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const hoverStyles = useHoverStyles()

  useEffect(() => {
    const canShare = async () => {
      const canShare = await Sharing.isAvailableAsync()
      setCanShare(canShare)
    }

    void canShare()
  }, [])

  const handleSharePress = async () => {
    if (!canShare) {
      return
    }

    void Sharing.shareAsync(referralHref).catch(() => null)
  }

  return (
    <YStack gap={'$3.5'} {...props}>
      <Link href={`/profile/${profile?.send_id}`}>
        <FadeCard>
          <XStack gap={'$3.5'}>
            <Avatar size={'$7'} br={'$4'}>
              <Avatar.Image src={avatar_url ?? ''} />
              <Avatar.Fallback f={1} ai={'center'} theme="green_active" bc="$color2">
                <IconAccount $theme-light={{ color: '$color12' }} />
              </Avatar.Fallback>
            </Avatar>
            <YStack jc={'space-between'} f={1}>
              <Paragraph size={'$8'} fontWeight={600} numberOfLines={1}>
                {name || '---'}
              </Paragraph>
              <Separator width="100%" borderColor="$decay" />
              <ReferralLink p={0} />
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
            <Button.Icon>
              <IconShare size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
            </Button.Icon>
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
            onPress={() => setShareDialogOpen(true)}
          >
            <Button.Icon>
              <IconQRFull size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />
            </Button.Icon>
            <Button.Text size={'$5'}>Share Profile</Button.Text>
          </Button>
        </XStack>
      </Fade>
      <ShareProfileDialog isOpen={shareDialogOpen} onClose={() => setShareDialogOpen(false)} />
    </YStack>
  )
}
