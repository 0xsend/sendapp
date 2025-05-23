import type {
  UseRecentSendersItem,
  UseRecentSendersResult,
} from 'app/features/activity/utils/useRecentSenders'
import { Avatar, Paragraph, YStack } from '@my/ui'
import { FlatList } from 'react-native'
import type { UseFavouriteSendersResult } from 'app/features/activity/utils/useFavouriteSenders'
import { useSendScreenParams } from 'app/routers/params'
import { Link } from 'solito/link'

export const SendSuggestions = ({
  recentSendersQuery,
  favouriteSendersQuery,
}: {
  recentSendersQuery: UseRecentSendersResult
  favouriteSendersQuery: UseFavouriteSendersResult
}) => {
  return (
    <>
      <RecentSenders recentSendersQuery={recentSendersQuery} />
      <FavouriteSenders favouriteSendersQuery={favouriteSendersQuery} />
    </>
  )
}

const RecentSenders = ({ recentSendersQuery }: { recentSendersQuery: UseRecentSendersResult }) => {
  const { error, data } = recentSendersQuery

  return (
    <YStack gap={'$3.5'}>
      <Paragraph size="$7">Recent Activity</Paragraph>
      {(() => {
        switch (true) {
          case !!error:
            return (
              <Paragraph color={'$error'}>
                {error.message?.split('.')[0] ?? 'Unknown error'}
              </Paragraph>
            )
          case !data || data.length === 0:
            return (
              <Paragraph
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Recent activity is empty, send it.
              </Paragraph>
            )
          default:
            return (
              <FlatList
                horizontal
                data={data || []}
                renderItem={({ item, index }) => <SenderSuggestion item={item} index={index} />}
                keyExtractor={(item, index) => item?.send_id?.toString() ?? String(index)}
                showsHorizontalScrollIndicator={false}
              />
            )
        }
      })()}
    </YStack>
  )
}

const FavouriteSenders = ({
  favouriteSendersQuery,
}: {
  favouriteSendersQuery: UseFavouriteSendersResult
}) => {
  const { error, data } = favouriteSendersQuery

  return (
    <YStack gap={'$3.5'}>
      <Paragraph size="$7">Favourite Senders</Paragraph>
      {(() => {
        switch (true) {
          case !!error:
            return (
              <Paragraph color={'$error'}>
                {error.message?.split('.')[0] ?? 'Unknown error'}
              </Paragraph>
            )
          case !data || data.length === 0:
            return (
              <Paragraph
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                No favourite senders, send it.
              </Paragraph>
            )
          default:
            return (
              <FlatList
                horizontal
                data={data || []}
                renderItem={({ item, index }) => <SenderSuggestion item={item} index={index} />}
                keyExtractor={(item, index) => item?.send_id?.toString() ?? String(index)}
                showsHorizontalScrollIndicator={false}
              />
            )
        }
      })()}
    </YStack>
  )
}

const SenderSuggestion = ({ item, index }: { item: UseRecentSendersItem; index: number }) => {
  const [sendParams] = useSendScreenParams()
  const _sendParams = JSON.parse(JSON.stringify(sendParams)) //JSON makes sure we don't pass undefined values

  const href = item?.tags?.[0]
    ? `/send?${new URLSearchParams({
        ..._sendParams,
        idType: 'tag',
        recipient: item.tags[0],
      }).toString()}`
    : `/send?${new URLSearchParams({
        ..._sendParams,
        idType: 'sendid',
        recipient: item?.send_id,
      }).toString()}`

  const label = item?.tags?.[0]
    ? `/${item.tags[0]}`
    : item?.name
      ? item.name
      : item?.send_id
        ? `#${item.send_id}`
        : '??'

  return (
    <SuggestionTile
      key={item?.send_id ?? index}
      href={href}
      avatarUrl={item?.avatar_url ?? ''}
      label={label}
    />
  )
}

const SuggestionTile = ({
  href,
  avatarUrl,
  label,
}: {
  href: string
  avatarUrl: string
  label: string
}) => {
  return (
    <Link href={href}>
      <YStack gap={'$1'} mr={'$2'} $gtLg={{ mr: '$3.5' }}>
        <Avatar size="$7" br="$4">
          <Avatar.Image src={avatarUrl} />
          <Avatar.Fallback jc="center" bc="$olive">
            <Avatar size="$7" br="$4">
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${label}&size=256&format=png&background=86ad7f`}
              />
            </Avatar>
          </Avatar.Fallback>
        </Avatar>
        <Paragraph
          w={74}
          size={'$3'}
          textOverflow={'ellipsis'}
          numberOfLines={1}
          color={'$lightGrayTextField'}
          ta={'center'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {label}
        </Paragraph>
      </YStack>
    </Link>
  )
}
