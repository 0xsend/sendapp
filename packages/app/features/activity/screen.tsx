import type { PropsWithChildren } from 'react'
import {
  AnimatePresence,
  Avatar,
  Button,
  Container,
  H4,
  Paragraph,
  ScrollView,
  Separator,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
  isWeb,
  useMedia,
} from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { SearchSchema, TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import { FormProvider } from 'react-hook-form'
import { Link } from 'solito/link'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconX } from 'app/components/icons'

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
    <TagSearchProvider>
      <YStack f={1} width={'100%'} pb="$4">
        <View>
          <Container>
            <YStack width={'100%'} gap="$size.1.5" $gtSm={{ gap: '$size.2.5' }}>
              <H4 color="$gray11Light" fontFamily={'$mono'} fontWeight={'500'} size={'$5'}>
                SEARCH BY
              </H4>
              <Search />
            </YStack>
          </Container>
        </View>

        <ActivityBody />
      </YStack>
    </TagSearchProvider>
  )
}

function ActivityBody() {
  const { isLoading, results, error } = useTagSearch()

  return (
    <AnimatePresence>
      {error && (
        <YStack key="error" gap="$4" mb="$4">
          <H4 theme={'alt2'}>Error</H4>
          <Text>{error.message}</Text>
        </YStack>
      )}

      <SearchResults />

      {results === null && !isLoading && !error && (
        <YStack
          key="suggestions"
          animation="quick"
          gap="$size.1.5"
          mb="$4"
          mt="$6"
          $gtSm={{ gap: '$size.2.5' }}
          exitStyle={{
            opacity: 0,
            y: 10,
          }}
        >
          {/* 
            <Separator $gtMd={{ display: 'none' }} />
            <Suggestions />
          */}

          <Separator $gtMd={{ display: 'none' }} />
          <RecentActivity />
        </YStack>
      )}
    </AnimatePresence>
  )
}

function SearchResults() {
  const { form, results, isLoading, error } = useTagSearch()

  const query = form.watch('query', '')

  if (isLoading) {
    return (
      <YStack key="loading" gap="$4" mt="$4">
        <Spinner size="large" color="$olive" />
      </YStack>
    )
  }

  if (!results || error) {
    return null
  }

  const noMatches = Object.values(results).every((value) => value === null)

  if (noMatches) {
    return (
      <Container>
        <Text mt="$4">No results for {query}... 😢</Text>
      </Container>
    )
  }

  return (
    <Container>
      <YStack
        testID="searchResults"
        key="searchResults"
        animation="quick"
        gap="$size.2.5"
        mt="$size.3.5"
        width="100%"
        enterStyle={{
          opacity: 0,
          y: -10,
        }}
      >
        {['phone_matches', 'tag_matches', 'send_id_matches'].map((key) =>
          Array.isArray(results[key]) && results[key].length ? (
            <YStack key={key} $gtLg={{ gap: '$3.5' }} gap="$2">
              <H4
                $theme-dark={{ color: '$lightGrayTextField' }}
                $theme-light={{ color: '$darkGrayTextField' }}
                fontFamily={'$mono'}
                fontWeight={'500'}
                size={'$5'}
                textTransform="uppercase"
              >
                {key.replace(/_matches/g, '').replace(/_/g, ' ')}
              </H4>
              <XStack gap="$5" flexWrap="wrap">
                {results[key].map((item) => (
                  <SearchResultRow key={item.send_id} keyField={key} item={item} query={query} />
                ))}
              </XStack>
            </YStack>
          ) : null
        )}
      </YStack>
    </Container>
  )
}

function HighlightMatchingText({ text, highlight }: { text: string; highlight: string }) {
  const regex = new RegExp(`(${highlight})`, 'gi')
  const parts = text.split(regex)

  return (
    <Text
      fontWeight={'300'}
      $theme-light={{ color: '$darkGrayTextField' }}
      $theme-dark={{ color: '$lightGrayTextField' }}
      fontSize="$7"
      $gtSm={{ fontSize: '$5' }}
    >
      {parts.map((part, i) =>
        regex.test(part) ? (
          <Text
            key={i + part}
            fontWeight="500"
            $theme-light={{ color: '$black' }}
            $theme-dark={{ color: '$white' }}
          >
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  )
}

function SearchResultRow({ keyField, item, query }) {
  const { resolvedTheme } = useThemeSetting()
  const rowBC = resolvedTheme?.startsWith('dark') ? '$metalTouch' : '$gray2Light'

  return (
    <View
      br="$5"
      key={item.send_id}
      width="100%"
      $gtLg={{
        width: isWeb ? 'calc((100% - 48px) / 3)' : '100%',
        bc: rowBC,
        p: '$1.5',
      }}
      $gtXl={{
        width: isWeb ? 'calc((100% - 72px) / 4)' : '100%',
      }}
    >
      <Link href={`/profile/${item.send_id}`}>
        <XStack testID={`tag-search-${item.send_id}`} ai="center" gap="$4">
          <Avatar size="$4.5" br="$3">
            <Avatar.Image src={item.avatar_url} />
            <Avatar.Fallback>
              <Avatar size="$4.5" br="$3">
                <Avatar.Image
                  src={`https://ui-avatars.com/api.jpg?name=${item.tag_name}&size=256`}
                />
                <Avatar.Fallback>
                  <Paragraph>??</Paragraph>
                </Avatar.Fallback>
              </Avatar>
            </Avatar.Fallback>
          </Avatar>
          <YStack gap="$1">
            <HighlightMatchingText
              text={(() => {
                switch (keyField) {
                  case 'phone_matches':
                    return item.phone
                  case 'tag_matches':
                    return item.tag_name
                  case 'send_id_matches':
                    return `#${item.send_id}`
                  default:
                    return null
                }
              })()}
              highlight={query}
            />
            <Text
              fontSize="$4"
              ff={'$mono'}
              $theme-light={{ color: '$darkGrayTextField' }}
              $gtSm={{ fontSize: '$2' }}
            >
              {item.tag_name ? `@${item.tag_name}` : `#${item.send_id}`}
            </Text>
          </YStack>
        </XStack>
      </Link>
    </View>
  )
}

// TODO: Replace with dynamic list
function Suggestions() {
  return (
    <YStack gap="$size.1" display="flex" $gtMd={{ display: 'none' }}>
      <Container>
        <MobileSectionLabel>SUGGESTIONS</MobileSectionLabel>
      </Container>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          maxWidth: 768,
          marginHorizontal: 'auto',
          paddingLeft: '$6',
        }}
      >
        {suggestions.map((user) => (
          <XStack
            key={user.username}
            ai="center"
            mr="$4"
            borderColor="$decay"
            borderWidth={1}
            pr="$3.5"
            gap="$3.5"
            borderRadius={'$11'}
            ml="$1.5"
          >
            <Avatar size="$4.5" br="$4" gap="$2" circular ml="$-1.5">
              <Avatar.Image src={user.avatar} />
              <Avatar.Fallback jc="center">
                <Spinner size="small" color="$send1" />
              </Avatar.Fallback>
            </Avatar>
            <Paragraph color="$color12" fontFamily="$mono" fontSize="$2">
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
    <Container>
      <YStack gap="$5" mb="$4" width={'100%'}>
        <XStack ai="center" jc="space-between" display="none" $gtMd={{ display: 'flex' }}>
          <TableLabel>Transactions</TableLabel>
          <XStack gap="$4">
            <TableLabel textAlign="right">Date</TableLabel>
            <TableLabel textAlign="right">Amount</TableLabel>
          </XStack>
        </XStack>

        {/* @TODO: Update with real values/filtering */}
        <RowLabel>PENDING</RowLabel>

        <MobileSectionLabel>ACTIVITIES</MobileSectionLabel>

        {activities.map((activity) => (
          <Row activity={activity} key={`${activity.username} - ${activity.time}`} />
        ))}

        <RowLabel>12 FEBRUARY 2024</RowLabel>

        {activities.map((activity) => (
          // @TODO: Replace key with unique id
          <Row activity={activity} key={`${activity.username} - ${activity.time}`} />
        ))}
      </YStack>
    </Container>
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
    <H4
      // @TODO: Update with theme color variable
      color="hsl(0, 0%, 42.5%)"
      fontFamily={'$mono'}
      fontWeight={'500'}
      size={'$5'}
      mt="$3"
      display="none"
      $gtMd={{ display: 'inline' }}
    >
      {children}
    </H4>
  )
}

function MobileSectionLabel({ children }: PropsWithChildren) {
  return (
    <H4
      color="$olive"
      fontFamily={'$mono'}
      fontWeight={'500'}
      size={'$5'}
      $gtMd={{ display: 'none' }}
    >
      {children}
    </H4>
  )
}

function Row({ activity }: { activity: (typeof activities)[number] }) {
  const media = useMedia()

  return (
    <XStack
      key={activity.time}
      ai="center"
      jc="space-between"
      gap="$4"
      borderBottomWidth={1}
      pb="$5"
      borderBottomColor={'$decay'}
      $gtMd={{ borderBottomWidth: 0, pb: '0' }}
    >
      <XStack gap="$4.5">
        <Avatar size="$4.5" br="$4" gap="$2">
          <Avatar.Image src={activity.avatar} />
          <Avatar.Fallback jc="center">
            <Spinner size="small" color="$send1" />
          </Avatar.Fallback>
        </Avatar>

        <YStack gap="$1.5">
          <Text color="$color12" fontSize="$7" $gtMd={{ fontSize: '$5' }}>
            {activity.username}
          </Text>
          <Text
            theme="alt2"
            color="$olive"
            fontFamily={'$mono'}
            fontSize="$4"
            $gtMd={{ fontSize: '$2' }}
          >
            @{activity.username}
          </Text>
        </YStack>
      </XStack>
      <XStack gap="$4">
        <Text
          color="$color12"
          display="none"
          minWidth={'$14'}
          textAlign="right"
          $gtMd={{ display: 'flex', jc: 'flex-end' }}
        >
          {activity.time}
        </Text>
        <Text
          color="$color12"
          textAlign="right"
          fontSize="$7"
          // @NOTE: font families don't change in `$gtMd` breakpoint
          fontFamily={media.md ? '$mono' : '$body'}
          $gtMd={{ fontSize: '$5', minWidth: '$14' }}
        >
          {activity.amount}
        </Text>
      </XStack>
    </XStack>
  )
}

function Search() {
  const { form } = useTagSearch()
  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$olive' : '$black'

  return (
    <View position="relative">
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
              placeholder: 'Name, $Sendtag, Phone',
              pr: '$size.3.5',
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

      <Button
        position="absolute"
        top="0"
        right="0"
        py={0}
        px="$1.5"
        br={0}
        borderBottomRightRadius="$4"
        borderTopRightRadius="$4"
        bc="transparent"
        hoverStyle={{
          backgroundColor: 'transparent',
          borderColor: '$transparent',
        }}
        pressStyle={{ backgroundColor: 'transparent' }}
        focusStyle={{ backgroundColor: 'transparent' }}
        onPress={() => form.setValue('query', '')}
        aria-label="Clear input."
      >
        <IconX width="$size.1.5" height="$size.1.5" color={iconColor} />
      </Button>
    </View>
  )
}
