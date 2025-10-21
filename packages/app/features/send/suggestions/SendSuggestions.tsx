import { Avatar, Paragraph, Text, YStack } from '@my/ui'
import { FlatList, Platform } from 'react-native'
import { useSendScreenParams } from 'app/routers/params'
import { Link } from 'solito/link'
import type {
  SendSuggestionItem,
  SendSuggestionsQueryResult,
} from 'app/features/send/suggestions/SendSuggestion.types'

export const SendSuggestions = ({
  recentSendersQuery,
  favouriteSendersQuery,
  topSendersQuery,
  todayBirthdaySendersQuery,
}: {
  recentSendersQuery: SendSuggestionsQueryResult
  favouriteSendersQuery: SendSuggestionsQueryResult
  topSendersQuery: SendSuggestionsQueryResult
  todayBirthdaySendersQuery: SendSuggestionsQueryResult
}) => {
  return (
    <>
      <SuggestionsList query={recentSendersQuery} title={'Recent Activity'} />
      <SuggestionsList query={favouriteSendersQuery} title={'Favorite Senders'} />
      <SuggestionsList query={topSendersQuery} title={'Top Senders'} />
      <SuggestionsList query={todayBirthdaySendersQuery} title={'Wish Them Happy Birthday'} />
    </>
  )
}

const SuggestionsList = ({
  query,
  title,
}: {
  query: SendSuggestionsQueryResult
  title: string
}) => {
  const { error, data } = query

  if (!data || data.length === 0) {
    return null
  }

  return (
    <YStack gap={'$3.5'}>
      <Paragraph size="$7" fontWeight={600}>
        {title}
      </Paragraph>
      {(() => {
        switch (true) {
          case !!error:
            return (
              <Paragraph color={'$error'}>
                {error.message?.split('.')[0] ?? 'Unknown error'}
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
                style={{
                  overflow: Platform.OS === 'web' ? undefined : 'visible',
                }}
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

  // Prefer main_tag_name, fallback to first tag in tags array
  const tagToUse = item?.main_tag_name || item?.tags?.[0]

  const href = tagToUse
    ? `/send${Platform.OS === 'web' ? '' : '/form'}?${new URLSearchParams({
        ..._sendParams,
        idType: 'tag',
        recipient: tagToUse,
      }).toString()}`
    : `/send${Platform.OS === 'web' ? '' : '/form'}?${new URLSearchParams({
        ..._sendParams,
        idType: 'sendid',
        recipient: item?.send_id,
      }).toString()}`

  const label = tagToUse
    ? `/${tagToUse}`
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
      <YStack
        gap={'$2'}
        mr={'$2'}
        $gtLg={{ mr: '$3.5' }}
        elevation={Platform.OS === 'web' ? undefined : '$0.75'}
      >
        <Avatar size="$7" br="$4" elevation={'$0.75'}>
          {Platform.OS === 'android' && !avatarUrl ? (
            <Avatar.Image
              src={`https://ui-avatars.com/api/?name=${label}&size=256&format=png&background=86ad7f`}
            />
          ) : (
            <>
              <Avatar.Image src={avatarUrl} />
              <Avatar.Fallback jc="center" bc="$olive">
                <Avatar size="$7" br="$4">
                  <Avatar.Image
                    src={`https://ui-avatars.com/api/?name=${label}&size=256&format=png&background=86ad7f`}
                  />
                </Avatar>
              </Avatar.Fallback>
            </>
          )}
        </Avatar>
        <Text
          w={74}
          fontSize={'$3'}
          numberOfLines={1}
          ellipsizeMode="tail"
          color={'$lightGrayTextField'}
          ta={'center'}
          $theme-light={{ color: '$color12' }}
        >
          {label}
        </Text>
      </YStack>
    </Link>
  )
}
