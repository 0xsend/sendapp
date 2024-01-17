import { Button, Container, KVTable, Paragraph, XStack, YStack } from '@my/ui'

const users = [
  {
    rank: 1,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 2,
    sendTag: '0xUser1',
    points: 90,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 3,
    sendTag: '0xUser2',
    points: 80,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 4,
    sendTag: '0xUser3',
    points: 70,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 5,
    sendTag: '0xUser4',
    points: 60,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 6,
    sendTag: '0xUser5',
    points: 50,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 7,
    sendTag: '0xUser6',
    points: 40,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 8,
    sendTag: '0xUser7',
    points: 30,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 9,
    sendTag: '0xUser8',
    points: 20,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 10,
    sendTag: '0xUser9',
    points: 10,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 11,
    sendTag: '0xUser10',
    points: 5,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 12,
    sendTag: '0xUser11',
    points: 5,
    referralLink: 'send.it/referral/132442314',
  },
  {
    rank: 13,
    sendTag: '0xUser12',
    points: 5,
    referralLink: 'send.it/referral/132442314',
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
    <YStack gap="$6" p="$8" br="$8" bg="$backgroundStrong">
      <LeaderBoardHeader />
      <LeaderboardList />
    </YStack>
  )
}

function LeaderBoardHeader() {
  return (
    <XStack gap="$3" ai="center" jc="center">
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" color={'$gray8'}>
        Rank
      </Paragraph>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" color={'$gray8'} ta="center">
        Send Tag
      </Paragraph>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" color={'$gray8'} ta="center">
        Points
      </Paragraph>
      <Paragraph w="20%" f={2} mb="0" size="$6" lineHeight="$4" color={'$gray8'} ta="right">
        Referral Link
      </Paragraph>
    </XStack>
  )
}

function LeaderboardList() {
  return users.map((user) => (
    <XStack gap="$3" ai="center" jc={'center'} key={user.sendTag}>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4">
        {user.rank}
      </Paragraph>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" ta="center">
        {user.sendTag}
      </Paragraph>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" ta="center">
        {user.points}
      </Paragraph>
      <Paragraph w="20%" f={2} mb="0" size="$6" lineHeight="$4" ta="right" color={'$gold8'}>
        {user.referralLink}
      </Paragraph>
    </XStack>
  ))
}
