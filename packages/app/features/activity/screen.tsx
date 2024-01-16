import {
  Avatar,
  Container,
  H1,
  H4,
  Paragraph,
  ScrollView,
  Text,
  XStack,
  YStack,
  useDebounce,
} from '@my/ui'
import { IconQRCode } from 'app/components/icons'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'

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
  const form = useForm<SearchSchema>()
  async function onSearch({ search }: SearchSchema) {
    console.log('TODO: search', search)
  }
  const debouncedSearch = useDebounce((args: SearchSchema) => onSearch(args), 300)
  const search = form.watch('search')

  useEffect(() => {
    debouncedSearch({ search })
  }, [search, debouncedSearch])

  return (
    <Container>
      <YStack f={1} width={'100%'} py="$4" space="$4">
        <YStack
          alignItems="center"
          width={'100%'}
          $gtSm={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <H1>Activity</H1>
          <Search form={form} />
          <IconQRCode />
        </YStack>
        <YStack space="$2">
          <H4 theme={'alt2'}>Suggested...</H4>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* TODO: Replace with dynamic list */}
            {suggestions.map((user) => (
              <XStack key={user.username} ai="center" mx="$4" space="$2">
                <Avatar size="$4" br="$4" space="$2">
                  <Avatar.Image src={user.avatar} />
                  <Avatar.Fallback bc="red" />
                </Avatar>
                <Paragraph>@{user.username}</Paragraph>
              </XStack>
            ))}
          </ScrollView>
        </YStack>

        <RecentActivity />
      </YStack>
    </Container>
  )
}

function RecentActivity() {
  return (
    <YStack space="$4" mb="$4">
      <H4 theme={'alt2'}>Recent Activity</H4>
      {/* TODO: Replace with dynamic list */}
      {activities.map((activity) => (
        <XStack key={activity.time} ai="center" space="$4">
          <Avatar size="$4" br="$4" space="$2">
            <Avatar.Image src={activity.avatar} />
            <Avatar.Fallback bc="red" />
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

const SearchSchema = z.object({
  search: formFields.text,
})
type SearchSchema = z.infer<typeof SearchSchema>
function Search({ form }: { form: ReturnType<typeof useForm<SearchSchema>> }) {
  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        defaultValues={{ search: '' }}
        onSubmit={() => {
          // noop
        }}
        schema={SearchSchema}
        props={{
          search: {
            placeholder: 'Search...',
          },
        }}
      >
        {({ search }) => search}
      </SchemaForm>
    </FormProvider>
  )
}
