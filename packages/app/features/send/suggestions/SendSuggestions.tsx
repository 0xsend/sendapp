import { Avatar, Paragraph, YStack } from '@my/ui'
import { FlatList } from 'react-native'
import { useSendScreenParams } from 'app/routers/params'
import { Link } from 'solito/link'
import type {
  SendSuggestionItem,
  SendSuggestionsQueryResult,
} from 'app/features/send/suggestions/SendSuggestion.types'

export const SendSuggestions = ({
  recentSendersQuery,
  favouriteSendersQuery,
  todayBirthdaySendersQuery,
}: {
  recentSendersQuery: SendSuggestionsQueryResult
  favouriteSendersQuery: SendSuggestionsQueryResult
  todayBirthdaySendersQuery: SendSuggestionsQueryResult
}) => {
  return (
    <>
      <SuggestionsList
        query={recentSendersQuery}
        title={'Recent Activity'}
        fallback={'Recent activity is empty, send it.'}
      />
      <SuggestionsList
        query={favouriteSendersQuery}
        title={'Favourite Senders'}
        fallback={'No favourite senders, send it.'}
      />
      <SuggestionsList
        query={todayBirthdaySendersQuery}
        title={'Wish Them Happy Birthday'}
        fallback={'No birthdays today, invite your friends to celebrate with them.'}
      />
    </>
  )
}

const SuggestionsList = ({
  query,
  fallback,
  title,
}: {
  query: SendSuggestionsQueryResult
  title: string
  fallback: string
}) => {
  const { error, data } = query

  return (
    <YStack gap={'$3.5'}>
      <Paragraph size="$7">{title}</Paragraph>
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
                {fallback}
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

const SenderSuggestion = ({ item, index }: { item: SendSuggestionItem; index: number }) => {
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
