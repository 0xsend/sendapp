import { Avatar, Card, H2, H3, LinearGradient, Paragraph, XStack, YStack } from '@my/ui'

const usersTest = [
  {
    rank: 1,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 2,
    sendTag: '0xUser1',
    points: 90,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 3,
    sendTag: '0xUser2',
    points: 80,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 4,
    sendTag: '0xUser3',
    points: 70,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 5,
    sendTag: '0xUser4',
    points: 60,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 6,
    sendTag: '0xUser5',
    points: 50,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 7,
    sendTag: '0xUser6',
    points: 40,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 8,
    sendTag: '0xUser7',
    points: 30,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 9,
    sendTag: '0xUser8',
    points: 20,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
  {
    rank: 10,
    sendTag: '0xUser9',
    points: 10,
    referralLink: 'send.it/referral/132442314',
    referrals: '1m 12s',
    sent: '1500 USDC',
  },
]

export function LeaderboardScreen() {
  return (
    <YStack w={'100%'} gap={'$size.3.5'} pb={'$size.2'} $gtMd={{ pt: 0 }} pt={'$size.3.5'}>
      <YStack gap={'$size.0.9'}>
        <H2 tt={'uppercase'} fontWeight={'900'} testID="mainTitle">
          Best in Class
        </H2>
        <Paragraph color={'$color10'} size={'$5'}>
          Register a Sendtag, maintain the minimum balance, and refer others to rise in the ranks.
        </Paragraph>
      </YStack>
      <YStack gap={'$size.1.5'} $gtMd={{ flexDirection: 'row' }}>
        <Leaderboard title="Referrals" list={usersTest} />
        <Leaderboard title="Transactions" list={usersTest} />
      </YStack>
    </YStack>
  )
}

function Leaderboard({ title, list }) {
  const isReferrals = title === 'Referrals'
  return (
    <Card f={1} pb={0}>
      <YStack br="$8">
        <YStack gap="$size.0.9" p="$5" $gtMd={{ p: '$8', pb: '$size.0.9' }} pb="$size.0.9" br="$8">
          <H3 pb={'$size.0.9'} fontWeight={'600'} size={'$7'} testID={`title${title}`}>
            {title}
          </H3>
          <LeaderBoardHeader isReferrals={isReferrals} />
          <LeaderboardList list={list} isReferrals={isReferrals} />
        </YStack>
        <LinearGradient
          pos="absolute"
          w="100%"
          h={'$size.9'}
          locations={[0, 1]}
          colors={['transparent', 'black']}
          b={0}
          borderBottomRightRadius={'$8'}
          borderBottomLeftRadius={'$8'}
        />
      </YStack>
    </Card>
  )
}

function LeaderBoardHeader({ isReferrals }) {
  return (
    <XStack
      gap="$3"
      ai="center"
      jc="space-between"
      borderBottomWidth={2}
      borderBottomColor={'$color9'}
      pb="$size.0.9"
    >
      <XStack>
        <Paragraph fontFamily={'$mono'} color={'$color10'} tt={'uppercase'} w="$size.3">
          #
        </Paragraph>
        <Paragraph fontFamily={'$mono'} color={'$color10'} tt={'uppercase'}>
          Sendtag
        </Paragraph>
      </XStack>

      <Paragraph fontFamily={'$mono'} color={'$color10'} tt={'uppercase'} ta="right">
        {isReferrals ? 'Referrals' : 'Total transactions'}
      </Paragraph>
    </XStack>
  )
}

function LeaderboardList({ list, isReferrals }) {
  return list.map((user) => (
    <XStack gap={'$size.0.9'} ai="center" jc={'space-between'} key={user.sendTag}>
      <XStack gap={'$2'} flexShrink={1}>
        <Paragraph mb="0" w="$size.3" lineHeight="$4" color={'$color10'} fontFamily={'$mono'}>
          {user.rank}
        </Paragraph>
        <XStack f={1} gap={'$size.0.9'} ai={'center'}>
          <Avatar size="$2" borderRadius={'$3'}>
            <Avatar.Image src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80" />
            <Avatar.Fallback
              backgroundColor={'$decay'}
              $theme-light={{ backgroundColor: '$white' }}
            />
          </Avatar>
          <Paragraph mb="0" lineHeight="$4" color="$primary">
            /{user.sendTag}
          </Paragraph>
        </XStack>
      </XStack>

      <Paragraph flexShrink={0} ta="right">
        {isReferrals ? user.points : user.sent}
      </Paragraph>
    </XStack>
  ))
}
