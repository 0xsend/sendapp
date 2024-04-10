import type { PropsWithChildren } from 'react'
import {
  AnimatePresence,
  Avatar,
  Container,
  H4,
  Paragraph,
  ScrollView,
  Spinner,
  Text,
  XStack,
  YStack,
} from '@my/ui'
import { IconQRCode } from 'app/components/icons'
import { SchemaForm } from 'app/utils/SchemaForm'
import { SearchSchema, TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import { FormProvider } from 'react-hook-form'
import { Link } from 'solito/link'

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
          mt="$7"
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
        <Link key={result.tag_name} href={`/profile/${result.tag_name}`}>
          <XStack testID={`tag-search-${result.tag_name}`} ai="center" space="$4">
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
        </Link>
      ))}
    </YStack>
  )
}
// TODO: Replace with dynamic list
function Suggestions() {
  return (
    <YStack gap="$2" display="flex" $gtMd={{ display: 'none' }}>
      <TableLabel>Suggestions</TableLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {suggestions.map((user) => (
          <XStack key={user.username} ai="center" mx="$4" space="$2">
            <Avatar size="$4" br="$4" space="$2">
              <Avatar.Image src={user.avatar} />
              <Avatar.Fallback jc="center">
                <Spinner size="small" color="$send1" />
              </Avatar.Fallback>
            </Avatar>
            <Paragraph color="$white" fontFamily="$mono">
              @{user.username}
            </Paragraph>
          </XStack>
        ))}
      </ScrollView>
    </YStack>
  )
}

// TODO: Replace with dynamic list
function RecentActivity() {
  return (
    <YStack gap="$5" mb="$4">
      <XStack ai="center" jc="space-between">
        <TableLabel>Transactions</TableLabel>
        <XStack gap="$4" display="none" $gtMd={{ display: 'flex' }}>
          <TableLabel textAlign="right">Date</TableLabel>
          <TableLabel textAlign="right">Amount</TableLabel>
        </XStack>
      </XStack>

      {/* @TODO: Update with real values/filtering */}
      <RowLabel>PENDING</RowLabel>

      {activities.map((activity) => (
        <Row activity={activity} key={`${activity.username} - ${activity.time}`} />
      ))}

      <RowLabel>12 FEBRUARY 2024</RowLabel>

      {activities.map((activity) => (
        // @TODO: Replace key with unique id
        <Row activity={activity} key={`${activity.username} - ${activity.time}`} />
      ))}
    </YStack>
  )
}

function TableLabel({
  textAlign = 'left',
  children,
}: { textAlign?: 'left' | 'right' } & PropsWithChildren) {
  return (
    <H4
      color={'$olive'}
      theme={'alt2'}
      fontWeight={'300'}
      size={'$8'}
      minWidth={'$14'}
      textAlign={textAlign}
    >
      {children}
    </H4>
  )
}

function RowLabel({ children }: PropsWithChildren) {
  return (
    <H4 color="hsl(0, 0%, 42.5%)" fontFamily={'$mono'} fontWeight={'500'} size={'$5'} mt="$3">
      {children}
    </H4>
  )
}

function Row({
  activity,
}: {
  activity: (typeof activities)[number]
}) {
  return (
    <XStack key={activity.time} ai="center" jc="space-between" gap="$4">
      <XStack gap="$4.5">
        <Avatar size="$4" br="$4" gap="$2">
          <Avatar.Image src={activity.avatar} />
          <Avatar.Fallback jc="center">
            <Spinner size="small" color="$send1" />
          </Avatar.Fallback>
        </Avatar>

        <YStack gap="$1.5">
          <Text color="$white">{activity.username}</Text>
          <Text theme="alt2" color="$olive" fontFamily={'$mono'} fontSize={12}>
            @{activity.username}
          </Text>
        </YStack>
      </XStack>
      <XStack gap="$4">
        <Text
          color="$white"
          display="none"
          minWidth={'$14'}
          textAlign="right"
          $gtMd={{ display: 'inline' }}
        >
          {activity.time}
        </Text>
        <Text color="$white" minWidth={'$14'} textAlign="right">
          {activity.amount}
        </Text>
      </XStack>
    </XStack>
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
          als: 'center',
          $gtSm: {
            maxWidth: '100%',
          },
        }}
      >
        {({ query }) => query}
      </SchemaForm>
    </FormProvider>
  )
}
