import {
  AnimatePresence,
  Avatar,
  Container,
  H1,
  H4,
  Paragraph,
  ScrollView,
  Spinner,
  Stack,
  Text,
  XStack,
  YStack,
} from '@my/ui'
import { IconQRCode } from 'app/components/icons'
import { SchemaForm } from 'app/utils/SchemaForm'
import { SearchSchema, TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import { FormProvider } from 'react-hook-form'

const activities = [
  {
    username: 'ethentree',
    amount: '200 USDT',
    value: '199.98',
    time: '1 min ago',
    avatar: 'https://i.pravatar.cc/150?u=ethentree',
  },
  {
    username: 'bigboss',
    amount: '500 ETH',
    value: '1,250,000',
    time: '2 mins ago',
    avatar: 'https://i.pravatar.cc/150?u=bigboss',
  },
  {
    username: 'coincollector',
    amount: '75 BTC',
    value: '2,850,000',
    time: '10 mins ago',
    avatar: 'https://i.pravatar.cc/150?u=coincollector',
  },
  {
    username: 'trademaster',
    amount: '1,000 LTC',
    value: '160,000',
    time: '1 hr ago',
    avatar: 'https://i.pravatar.cc/150?u=trademaster',
  },
  {
    username: 'hodlqueen',
    amount: '10,000 XRP',
    value: '7,200',
    time: '1 day ago',
    avatar: 'https://i.pravatar.cc/150?u=hodlqueen',
  },
]

const suggestions = [
  { username: '0xUser', avatar: 'https://i.pravatar.cc/150?u=0xUser' },
  { username: '0xUser1', avatar: 'https://i.pravatar.cc/150?u=0xUser1' },
  { username: '0xUser2', avatar: 'https://i.pravatar.cc/150?u=0xUser2' },
  { username: '0xUser3', avatar: 'https://i.pravatar.cc/150?u=0xUser3' },
  { username: '0xUser4', avatar: 'https://i.pravatar.cc/150?u=0xUser4' },
  { username: '0xUser5', avatar: 'https://i.pravatar.cc/150?u=0xUser5' },
  // ... more suggestions
]

export function ActivityScreen() {
  return (
    <Container>
      <TagSearchProvider>
        <YStack f={1} width={'100%'} py="$4" space="$4">
          <XStack alignItems="center" width={'100%'} gap="$6">
            <Search />
            <IconQRCode />
          </XStack>

          <ActivityBody />
        </YStack>
      </TagSearchProvider>
    </Container>
  )
}

function ActivityBody() {
  const { isLoading, results, error } = useTagSearch()

  return (
    <AnimatePresence>
      {isLoading && (
        <YStack key="loading" space="$4" mb="$4">
          <Spinner size="large" color="$send1" />
        </YStack>
      )}

      {error && (
        <YStack key="error" space="$4" mb="$4">
          <H4 theme={'alt2'}>Error</H4>
          <Text>{error.message}</Text>
        </YStack>
      )}

      <SearchResults />
      {results === null && !isLoading && !error && (
        <YStack
          key="suggestions"
          animation="quick"
          space="$4"
          mb="$4"
          exitStyle={{
            opacity: 0,
            y: 10,
          }}
        >
          <Suggestions />
          <RecentActivity />
        </YStack>
      )}
    </AnimatePresence>
  )
}

function SearchResults() {
  const { form, results, isLoading, error } = useTagSearch()
  const query = form.watch('query', '')

  if (!results || isLoading || error) {
    return null
  }

  return (
    <YStack
      testID="searchResults"
      key="searchResults"
      animation="quick"
      space="$4"
      mb="$4"
      enterStyle={{
        opacity: 0,
        y: -10,
      }}
    >
      <H4 theme={'alt2'}>Results</H4>
      {results.length === 0 && <Text>No results for {query}... 😢</Text>}
      {results.map((result) => (
        <XStack
          testID={`tag-search-${result.tag_name}`}
          key={result.tag_name}
          ai="center"
          space="$4"
        >
          <Avatar size="$4" br="$4" space="$2">
            <Avatar.Image src={result.avatar_url} />
            <Avatar.Fallback>
              <Avatar>
                <Avatar.Image
                  src={`https://ui-avatars.com/api.jpg?name=${result.tag_name}&size=256`}
                />
                <Avatar.Fallback>
                  <Paragraph>??</Paragraph>
                </Avatar.Fallback>
              </Avatar>
            </Avatar.Fallback>
          </Avatar>
          <YStack space="$1">
            <Text>{result.tag_name}</Text>
          </YStack>
        </XStack>
      ))}
    </YStack>
  )
}
// TODO: Replace with dynamic list
function Suggestions() {
  return (
    <YStack space="$2">
      <H4 theme={'alt2'}>Suggested...</H4>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {suggestions.map((user) => (
          <XStack key={user.username} ai="center" mx="$4" space="$2">
            <Avatar size="$4" br="$4" space="$2">
              <Avatar.Image src={user.avatar} />
              <Avatar.Fallback jc="center">
                <Spinner size="small" color="$send1" />
              </Avatar.Fallback>
            </Avatar>
            <Paragraph>@{user.username}</Paragraph>
          </XStack>
        ))}
      </ScrollView>
    </YStack>
  )
}

// TODO: Replace with dynamic list
function RecentActivity() {
  return (
    <YStack space="$4" mb="$4">
      <H4 theme={'alt2'}>Recent Activity</H4>
      {activities.map((activity) => (
        <XStack key={activity.time} ai="center" space="$4">
          <Avatar size="$4" br="$4" space="$2">
            <Avatar.Image src={activity.avatar} />
            <Avatar.Fallback jc="center">
              <Spinner size="small" color="$send1" />
            </Avatar.Fallback>
          </Avatar>
          <YStack space="$1">
            <Text>{activity.username}</Text>
            <Text theme="alt2">
              ${activity.amount} (${activity.value})
            </Text>
          </YStack>
          <Text theme="alt2">{activity.time}</Text>
        </XStack>
      ))}
    </YStack>
  )
}

function Search() {
  const { form } = useTagSearch()
  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        defaultValues={{ query: '' }}
        onSubmit={() => {
          // noop
        }}
        schema={SearchSchema}
        props={{
          query: {
            placeholder: 'Search',
          },
        }}
        formProps={{
          width: '100%',
          f: 1,
        }}
      >
        {({ query }) => query}
      </SchemaForm>
    </FormProvider>
  )
}
