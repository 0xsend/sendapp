import {
  Avatar,
  Card,
  dataProviderMakerNative,
  layoutProviderMakerNative,
  Paragraph,
  Spinner,
  XStack,
  YStack,
} from '@my/ui'
import { useCallback, useMemo } from 'react'
import type { Functions } from '@my/supabase/database.types'
import { toNiceError } from 'app/utils/toNiceError'
import { IconBirthday } from 'app/components/icons'
import { adjustUTCDateForTimezone } from 'app/utils/dateHelper'
import { useFriendsFeed } from 'app/features/affiliate/utils/useFriendsFeed'
import { ReferralLink } from 'app/components/ReferralLink'
import { RecyclerListView } from 'recyclerlistview'
import { useLink } from 'solito/link'

type Referral = Functions<'get_friends'>[number]

export default function FriendsScreen() {
  const friendsFeedQuery = useFriendsFeed({
    pageSize: 10,
  })
  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } =
    friendsFeedQuery

  const referrals = useMemo(() => data?.pages.flat() || [], [data])

  const dataProvider = useMemo(() => {
    return dataProviderMakerNative(referrals)
  }, [referrals])

  const layoutProvider = useMemo(
    () =>
      layoutProviderMakerNative({
        getHeightOrWidth: () => 90,
      }),
    []
  )

  const rowRenderer = useCallback(
    (type: string | number, item: Referral) => <FriendMobileRow referral={item} />,
    []
  )

  const handleEndReach = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <Spinner size="small" />

  if (error !== null) {
    return (
      <Paragraph maxWidth={600} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
        {toNiceError(error)}
      </Paragraph>
    )
  }

  if (referrals.length === 0) {
    return (
      <YStack w={'100%'} ai={'flex-start'} pt={'$5'} gap={'$5'}>
        <Paragraph size={'$5'}>Invite friends to Send using your referral code.</Paragraph>
        <ReferralLink f={0} p={0} />
      </YStack>
    )
  }

  return (
    <YStack f={1}>
      <RecyclerListView
        style={{ flex: 1, overflow: 'visible' }}
        dataProvider={dataProvider}
        rowRenderer={rowRenderer}
        layoutProvider={layoutProvider}
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
        }}
        onEndReached={handleEndReach}
        onEndReachedThreshold={0.5}
      />
      <XStack py={'$3.5'} jc={'center'}>
        <Spinner
          opacity={!isLoading && isFetchingNextPage ? 1 : 0}
          size="small"
          color={'$color12'}
        />
      </XStack>
    </YStack>
  )
}

const FriendMobileRow = ({ referral }: { referral: Referral }) => {
  const linkProps = useLink({ href: `/profile/${referral.sendid}` })
  const birthday = referral.birthday
    ? adjustUTCDateForTimezone(new Date(referral.birthday)).toLocaleString(undefined, {
        day: 'numeric',
        month: 'long',
      })
    : 'NA'

  const label = referral.tag
    ? `/${referral.tag}`
    : referral.name || referral.sendid
      ? `#${referral.sendid}`
      : '??'

  return (
    <Card w={'100%'} gap={'$3.5'} br={'$5'} p={'$3.5'} {...linkProps}>
      <XStack w={'100%'} ai={'center'}>
        <XStack f={1} w={'100%'} gap={'$3.5'}>
          <Avatar size="$4.5" br="$4" gap="$2">
            <Avatar.Image src={referral.avatar_url ?? ''} />
            <Avatar.Fallback jc="center" bc="$olive">
              <Avatar size="$4.5" br="$4">
                <Avatar.Image
                  src={`https://ui-avatars.com/api/?name=${referral.tag}&size=256&format=png&background=86ad7f`}
                />
              </Avatar>
            </Avatar.Fallback>
          </Avatar>
          <YStack gap={'$2'} f={1}>
            <Paragraph lineHeight={20}>{label}</Paragraph>
            <XStack gap={'$2'} alignItems={'center'}>
              <IconBirthday size={'$1'} />
              <Paragraph lineHeight={20}>{birthday}</Paragraph>
            </XStack>
          </YStack>
        </XStack>
      </XStack>
    </Card>
  )
}
