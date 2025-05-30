import { Avatar, Card, H2, H3, Paragraph, XStack, YStack } from '@my/ui'
import { useLeaderboard } from './utils/useLeaderboard'
import type { LeaderboardEntry } from 'app/utils/zod/leaderboard'

export function LeaderboardScreen() {
  const { data } = useLeaderboard()

  return (
    <YStack w={'100%'} gap={'$3.5'} pb={'$2'} $gtMd={{ pt: 0 }} pt={'$3.5'}>
      <YStack gap={'$0.9'}>
        <H2 tt={'uppercase'} fontWeight={'900'} testID="mainTitle">
          Best in Class
        </H2>
        <Paragraph color={'$color10'} size={'$5'}>
          Register a Sendtag, maintain the minimum balance, and refer others to rise in the ranks.
        </Paragraph>
      </YStack>
      {data?.referrals.length ? (
        <YStack gap={'$1.5'} $gtMd={{ flexDirection: 'row' }} maxWidth={600}>
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
        <YStack gap="$0.9" p="$5" $gtMd={{ p: '$8', pb: '$0.9' }} pb="$0.9" br="$8">
          <H3 pb={'$0.9'} fontWeight={'600'} size={'$7'} testID={`title${title}`}>
            {title}
          </H3>
          <LeaderBoardHeader isReferrals={isReferrals} />
          <LeaderboardList list={list} isReferrals={isReferrals} />
        </YStack>
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
      pb="$0.9"
    >
      <XStack>
        <Paragraph fontFamily={'$mono'} color={'$color10'} tt={'uppercase'} w="$3">
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
      gap={'$0.9'}
      ai="center"
      jc={'space-between'}
      key={user.send_id}
      testID={`${user.id}-${user.send_id}`}
    >
      <XStack gap={'$2'} flexShrink={1}>
        <Paragraph mb={0} w="$3" lineHeight="$4" color={'$color10'} fontFamily={'$mono'}>
          {i + 1}
        </Paragraph>
        <XStack f={1} gap={'$0.9'} ai={'center'}>
          <Avatar size="$2" borderRadius={'$3'}>
            <Avatar.Image src={user.avatar_url ?? undefined} />
            <Avatar.Fallback
              backgroundColor={'$decay'}
              $theme-light={{ backgroundColor: '$white' }}
            />
          </Avatar>
          <Paragraph mb={0} lineHeight="$4" color="$primary" $theme-light={{ color: '$color12' }}>
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
