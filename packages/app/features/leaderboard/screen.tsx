import { Avatar, Card, H2, H3, LinearGradient, Paragraph, XStack, YStack } from '@my/ui'
import { useLeaderboard } from './utils/useLeaderBoard'
import type { LeaderboardEntry } from 'app/utils/zod/leaderboard'

export function LeaderboardScreen() {
  const { data } = useLeaderboard()

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
      {data?.referrals.length ? (
        <YStack
          gap={'$size.1.5'}
          $gtMd={{ flexDirection: 'row' }}
          // @TODO: remove when we get transactions
          maxWidth={'600px'}
        >
          <Leaderboard title="Referrals" list={data?.referrals} />
          {/* <Leaderboard title="Transactions" list={data?.rewards} /> */}
        </YStack>
      ) : (
        <Paragraph>Unable to find leaderboard data</Paragraph>
      )}
    </YStack>
  )
}

function Leaderboard({ title, list }: { title: string; list: LeaderboardEntry[] }) {
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

function LeaderBoardHeader({ isReferrals }: { isReferrals: boolean }) {
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

const getName = (user: LeaderboardEntry['user']) => {
  switch (true) {
    case Array.isArray(user.tags) && !!user.tags.length:
      return `/${user.tags[0]}`
    case !!user.name:
      return user.name
    case !!user.send_id:
      return user.send_id
  }
}

function LeaderboardList({
  list,
  isReferrals,
}: { isReferrals: boolean; list: LeaderboardEntry[] }) {
  return list.map(({ user, referrals, rewards_usdc }, i) => (
    <XStack
      gap={'$size.0.9'}
      ai="center"
      jc={'space-between'}
      key={user.send_id}
      testID={`${user.id}-${user.send_id}`}
    >
      <XStack gap={'$2'} flexShrink={1}>
        <Paragraph mb="0" w="$size.3" lineHeight="$4" color={'$color10'} fontFamily={'$mono'}>
          {i + 1}
        </Paragraph>
        <XStack f={1} gap={'$size.0.9'} ai={'center'}>
          <Avatar size="$2" borderRadius={'$3'}>
            <Avatar.Image src={user.avatar_url} />
            <Avatar.Fallback
              backgroundColor={'$decay'}
              $theme-light={{ backgroundColor: '$white' }}
            />
          </Avatar>
          <Paragraph mb="0" lineHeight="$4" color="$primary">
            {getName(user)}
          </Paragraph>
        </XStack>
      </XStack>

      <Paragraph flexShrink={0} ta="right">
        {isReferrals ? referrals : rewards_usdc}
      </Paragraph>
    </XStack>
  ))
}
