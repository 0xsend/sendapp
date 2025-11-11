import {
  Avatar,
  Card,
  Link,
  Paragraph,
  Separator,
  Spinner,
  useMedia,
  XStack,
  YStack,
  dataProviderMakerWeb,
  layoutProviderMakerWeb,
} from '@my/ui'
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import type { Functions } from '@my/supabase/database.types'
import { toNiceError } from 'app/utils/toNiceError'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { IconBirthday, IconBadgeCheckSolid } from 'app/components/icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { adjustUTCDateForTimezone } from 'app/utils/dateHelper'
import { useReferrer } from 'app/utils/useReferrer'
import { useFriendsFeed } from 'app/features/affiliate/utils/useFriendsFeed'
import { ReferralLink } from 'app/components/ReferralLink'
import { RecyclerListView, type Dimension } from 'recyclerlistview/web'

type Referral = Pick<
  Functions<'profile_lookup'>[number],
  | 'avatar_url'
  | 'x_username'
  | 'links_in_bio'
  | 'birthday'
  | 'tag'
  | 'name'
  | 'sendid'
  | 'is_verified'
>

export default function FriendsScreen() {
  const media = useMedia()
  const { isAtEnd } = useScrollDirection()
  const [layoutSize, setLayoutSize] = useState<Dimension>({ width: 0, height: 0 })
  const friendsFeedQuery = useFriendsFeed({
    pageSize: 10,
  })
  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } =
    friendsFeedQuery
  const { data: referrer, isLoading: isReferrerLoading } = useReferrer()

  const referrals = useMemo(() => {
    const refs: Referral[] = []

    if (referrer) {
      refs.push(referrer)
    }

    if (data?.pages) {
      refs.push(...(data.pages.flat() as Referral[]))
    }

    return refs
  }, [data, referrer])
  const [dataProvider, setDataProvider] = useState(dataProviderMakerWeb(referrals))

  const layoutSizeAdjustment = media.gtLg ? 78 : 0

  const _layoutProvider = layoutProviderMakerWeb({
    getHeightOrWidth: () => (media.gtLg ? 42 : 96),
  })

  const _renderRow = useCallback(
    (_, referral: Referral, index: number) =>
      media.gtLg ? (
        <FriendDesktopRow referral={referral} referrer={referrer} index={index} />
      ) : (
        <FriendMobileRow referral={referral} referrer={referrer} />
      ),
    [referrer, media.gtLg]
  )

  const renderFooter = () => {
    if (!isLoading && isFetchingNextPage) {
      return <Spinner size="small" color={'$color12'} mb="$3.5" />
    }
    return <Spinner opacity={0} mb="$3.5" />
  }

  useEffect(() => {
    setDataProvider((prev) => prev.cloneWithRows(referrals))
  }, [referrals])

  useEffect(() => {
    setTimeout(() => {
      if (isAtEnd && hasNextPage && !isFetchingNextPage) {
        fetchNextPage().then(({ data }) => {
          const referrals: Referral[] = []

          if (referrer) {
            referrals.push(referrer)
          }

          if (data?.pages) {
            referrals.push(...(data.pages.flat() as Referral[]))
          }

          setDataProvider((prev) => prev.cloneWithRows(referrals))
        })
      }
    }, 50)
  }, [isAtEnd, hasNextPage, fetchNextPage, isFetchingNextPage, referrer])

  const onCardLayout = useCallback((e) => {
    setLayoutSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
  }, [])

  if (isLoading || isReferrerLoading) return <Spinner size="small" />

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
    <YStack flex={1} onLayout={onCardLayout} pb={'$3.5'}>
      {dataProvider.getSize() > 0 && layoutSize.height > 0 ? (
        <FriendsListTable>
          <RecyclerListView
            style={{ flex: 1, overflow: 'auto' }}
            dataProvider={dataProvider}
            rowRenderer={_renderRow}
            layoutProvider={_layoutProvider}
            renderFooter={renderFooter}
            layoutSize={{
              width: layoutSize.width - layoutSizeAdjustment,
              height: layoutSize.height,
            }}
            key={`recycler-${layoutSize.width}-${layoutSize.height}`}
          />
        </FriendsListTable>
      ) : null}
    </YStack>
  )
}

const FriendMobileRow = ({
  referral,
  referrer,
}: {
  referral: Referral
  referrer?: Referral | null
}) => {
  const hoverStyles = useHoverStyles()

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
    <Card w={'100%'} gap={'$3.5'} br={'$5'} p={'$3.5'} cursor={'pointer'} hoverStyle={hoverStyles}>
      <XStack f={1} w={'100%'} ai={'center'}>
        <Link
          href={referral.tag ? `/${referral.tag}` : `/profile/${referral.sendid}`}
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
              <XStack ai="center" gap="$2">
                <Paragraph lineHeight={20}>
                  {label}
                  {referral.sendid === referrer?.sendid ? ' (Invited you to Send)' : ''}
                </Paragraph>
                {referral.is_verified ? (
                  <IconBadgeCheckSolid
                    size={'$1.5'}
                    mih={'$1.5'}
                    miw={'$1.5'}
                    color={'$primary'}
                    $theme-light={{ color: '$color12' }}
                  />
                ) : null}
              </XStack>
              <XStack gap={'$2'} alignItems={'center'}>
                <IconBirthday size={'$1'} />
                <Paragraph lineHeight={20}>{birthday}</Paragraph>
              </XStack>
            </YStack>
          </XStack>
        </Link>
      </XStack>
    </Card>
  )
}

const FriendDesktopRow = ({
  referral,
  referrer,
  index,
}: {
  referral: Referral
  index: number
  referrer?: Referral | null
}) => {
  const hoverStyles = useHoverStyles()

  const birthday = referral.birthday
    ? adjustUTCDateForTimezone(new Date(referral.birthday)).toLocaleString(undefined, {
        day: 'numeric',
        month: 'long',
      })
    : 'NA'

  return (
    <Link href={`/${referral.tag}`}>
      <XStack
        gap={'$3.5'}
        px={'$3.5'}
        py={'$2'}
        ai={'center'}
        cursor={'pointer'}
        br={'$3'}
        hoverStyle={hoverStyles}
      >
        <Paragraph
          w={'3%'}
          tt={'uppercase'}
          textAlign={'right'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {index + 1}
        </Paragraph>
        <XStack w={'45%'} gap={'$2'} ai={'center'}>
          <Avatar size="$2" br="$2">
            <Avatar.Image src={referral.avatar_url ?? ''} />
            <Avatar.Fallback jc="center" bc="$olive">
              <Avatar size="$2" br="$2">
                <Avatar.Image
                  src={`https://ui-avatars.com/api/?name=${referral.tag}&size=256&format=png&background=86ad7f`}
                />
              </Avatar>
            </Avatar.Fallback>
          </Avatar>
          <XStack ai="center" gap="$2">
            <Paragraph lineHeight={20}>
              /{referral.tag}
              {referral.tag === referrer?.tag ? ' (Invited you to Send)' : ''}
            </Paragraph>
            {referral.is_verified ? (
              <IconBadgeCheckSolid
                size={'$1'}
                color={'$primary'}
                $theme-light={{ color: '$color12' }}
              />
            ) : null}
          </XStack>
        </XStack>
        <Paragraph w={'25%'} ta={'right'}>
          {birthday}
        </Paragraph>
      </XStack>
    </Link>
  )
}

const FriendsListTable = ({ children }: PropsWithChildren) => {
  const media = useMedia()

  if (media.gtLg) {
    return (
      <Card p={'$7'} gap={'$3.5'}>
        <XStack gap={'$3.5'} px={'$3.5'}>
          <Paragraph
            width={'3%'}
            tt={'uppercase'}
            textAlign={'right'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            #
          </Paragraph>
          <Paragraph
            width={'47%'}
            tt={'uppercase'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            sendtag
          </Paragraph>
          <Paragraph
            width={'25%'}
            tt={'uppercase'}
            textAlign={'right'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            birthday
          </Paragraph>
          <Paragraph
            width={'25%'}
            tt={'uppercase'}
            textAlign={'right'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            social link
          </Paragraph>
        </XStack>
        <Separator boc={'$darkGrayTextField'} />
        {children}
      </Card>
    )
  }

  return children
}
