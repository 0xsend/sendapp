import { Avatar, Card, Link, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { useCallback, useMemo } from 'react'
import type { Functions } from '@my/supabase/database.types'
import { toNiceError } from 'app/utils/toNiceError'
import { IconBirthday, IconXLogo } from 'app/components/icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { adjustUTCDateForTimezone } from 'app/utils/dateHelper'
import { useFriendsFeed } from 'app/features/affiliate/utils/useFriendsFeed'
import { ReferralLink } from 'app/components/ReferralLink'
import { FlatList, Linking, Pressable } from 'react-native'

type Referral = Pick<
  Functions<'profile_lookup'>[number],
  'avatar_url' | 'x_username' | 'birthday' | 'tag'
>

export default function FriendsScreen() {
  const friendsFeedQuery = useFriendsFeed({
    pageSize: 10,
  })
  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } =
    friendsFeedQuery

  const referrals = useMemo(() => {
    const refs: Referral[] = []

    if (data?.pages) {
      refs.push(...(data.pages.flat() as Referral[]))
    }

    return refs
  }, [data])

  const renderItem = useCallback(
    ({ item }: { item: Referral }) => <FriendMobileRow referral={item} />,
    []
  )

  const renderFooter = useCallback(() => {
    if (!isLoading && isFetchingNextPage) {
      return <Spinner size="small" color={'$color12'} mb="$3.5" />
    }
  }, [isLoading, isFetchingNextPage])

  const keyExtractor = useCallback((item: Referral) => item.tag || '', [])

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
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
    <YStack flex={1}>
      <FlatList
        data={referrals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      />
    </YStack>
  )
}

const FriendMobileRow = ({ referral }: { referral: Referral }) => {
  const hoverStyles = useHoverStyles()

  const birthday = referral.birthday
    ? adjustUTCDateForTimezone(new Date(referral.birthday)).toLocaleString(undefined, {
        day: 'numeric',
        month: 'long',
      })
    : 'NA'

  return (
    <Card w={'100%'} gap={'$3.5'} br={'$5'} p={'$3.5'} cursor={'pointer'} hoverStyle={hoverStyles}>
      <XStack f={1} w={'100%'} ai={'center'}>
        <Link
          href={`/${referral.tag}`}
          containerProps={{
            f: 1,
          }}
        >
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
              <Paragraph lineHeight={20}>/{referral.tag}</Paragraph>
              <XStack gap={'$2'} alignItems={'center'}>
                <IconBirthday size={'$1'} />
                <Paragraph lineHeight={20}>{birthday}</Paragraph>
              </XStack>
            </YStack>
          </XStack>
        </Link>
        {referral.x_username && (
          <Pressable onPress={() => Linking.openURL(`https://x.com/${referral.x_username}`)}>
            <IconXLogo size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />
          </Pressable>
        )}
      </XStack>
    </Card>
  )
}
