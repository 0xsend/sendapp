import { Container, Paragraph, XStack, YStack, useMedia, Avatar } from '@my/ui'
import { IconStar } from 'app/components/icons'
import { shorten } from 'app/utils/strings'

const users = [
  {
    rank: 1,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      avatar_url: 'https://avatars.githubusercontent.com/u/132442314?v=4',
      referral_code: '132442314',
    },
  },
  {
    rank: 2,
    sendTag: '0xUserLongAssSendTagNameForTesting',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      avatar_url: 'https://avatars.githubusercontent.com/u/132442314?v=4',
      referral_code: '132442314',
    },
  },
  {
    rank: 3,
    sendTag: '0xUser2',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      avatar_url: 'https://avatars.githubusercontent.com/u/132442314?v=4',
      referral_code: '132442314',
    },
  },
  {
    rank: 4,
    sendTag: '0xUser3',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      avatar_url: 'https://avatars.githubusercontent.com/u/132442314?v=4',
      referral_code: '132442314',
    },
  },
  {
    rank: 5,
    sendTag: '0xUser4',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      avatar_url: 'https://avatars.githubusercontent.com/u/132442314?v=4',
      referral_code: '132442314',
    },
  },
  {
    rank: 6,
    sendTag: '0xUser5',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 7,
    sendTag: '0xUser6',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 8,
    sendTag: '0xUser7',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      avatar_url: 'https://avatars.githubusercontent.com/u/132442314?v=4',
      referral_code: '132442314',
    },
  },
]

export function LeaderboardScreen() {
  return (
    <Container>
      <YStack f={1} width={'100%'} py="$4" space="$4">
        <LeaderboardSection />
      </YStack>
    </Container>
  )
}

function LeaderboardSection() {
  return (
    <YStack gap="$6" $gtSm={{ p: '$8', bg: '$backgroundStrong' }} br="$8">
      <LeaderBoardHeader />
      <LeaderboardList />
    </YStack>
  )
}

function LeaderBoardHeader() {
  return (
    <XStack gap="$3" ai="center" jc="space-between">
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4">
        Rank
      </Paragraph>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" ta="center">
        Send Tag
      </Paragraph>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" ta="right">
        Points
      </Paragraph>
    </XStack>
  )
}

function LeaderboardList() {
  const media = useMedia()
  return users.map((user) => (
    <XStack gap="$3" ai="center" jc={'space-between'} key={user.sendTag}>
      <Paragraph mb="0" size="$9" lineHeight="$4" fontWeight={'bold'}>
        {user.rank}
      </Paragraph>
      <XStack f={1} gap="$4" ai="center" jc={'center'}>
        <XStack w="90%" maw="$20" gap="$1" ai="center">
          <Avatar circular $gtMd={{ w: '$5', h: '$5' }} w={'$4'} h={'$4'}>
            <Avatar.Image src={user.profile.avatar_url} />
            <Avatar.Fallback backgroundColor="$backgroundPress" p="$2" delayMs={1000}>
              <IconStar />
            </Avatar.Fallback>
          </Avatar>
          <Paragraph f={1} mb="0" size="$6" lineHeight="$4" ta="left">
            {media.gtMd ? shorten(user.sendTag, 12, 3) : shorten(user.sendTag, 6, 3)}
          </Paragraph>
        </XStack>
      </XStack>
      <Paragraph mb="0" size="$6" lineHeight="$4" ta="right">
        {user.points}
      </Paragraph>
    </XStack>
  ))
}
