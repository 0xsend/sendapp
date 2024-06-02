import {
  Avatar,
  Button,
  ButtonText,
  Container,
  H4,
  Paragraph,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
  isWeb,
} from '@my/ui'
import { Link } from 'solito/link'
import { SearchSchema, useTagSearch } from 'app/provider/tag-search'
import { FormProvider } from 'react-hook-form'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconX } from 'app/components/icons'
import { useState } from 'react'
import type { Functions } from '@my/supabase/database.types'
import { useSendScreenParams } from 'app/routers/params'

type SearchResultsType = Functions<'tag_search'>[number]
type SearchResultsKeysType = keyof SearchResultsType
type SearchResultCommonType = SearchResultsType[SearchResultsKeysType][number]
const SEARCH_RESULTS_KEYS: SearchResultsKeysType[] = [
  'phone_matches',
  'tag_matches',
  'send_id_matches',
] as const
const formatResultsKey = (str: string): string => {
  return str.replace(/_matches/g, '').replace(/_/g, ' ')
}
export function SearchResults() {
  const { form, results, isLoading, error } = useTagSearch()
  const [resultsFilter, setResultsFilter] = useState<SearchResultsKeysType | null>(null)
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
  const matchesCount = Object.values(results).filter(
    (value) => Array.isArray(value) && value.length
  ).length
  if (matchesCount === 0) {
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
        {matchesCount > 1 && (
          <XStack gap="$size.0.75">
            <SearchFilterButton
              title="All"
              active={!resultsFilter}
              onPress={() => setResultsFilter(null)}
            />
            {SEARCH_RESULTS_KEYS.map((key) =>
              Array.isArray(results[key]) && results[key].length ? (
                <SearchFilterButton
                  key={key}
                  title={formatResultsKey(key)}
                  active={resultsFilter === key}
                  onPress={() => setResultsFilter(key as SearchResultsKeysType)}
                />
              ) : null
            )}
          </XStack>
        )}
        {SEARCH_RESULTS_KEYS.map((key) =>
          Array.isArray(results[key]) &&
          results[key].length &&
          (!resultsFilter || resultsFilter === key) ? (
            <YStack key={key} gap="$3.5">
              <H4
                $theme-dark={{ color: '$lightGrayTextField' }}
                $theme-light={{ color: '$darkGrayTextField' }}
                fontFamily={'$mono'}
                fontWeight={'500'}
                size={'$5'}
                textTransform="uppercase"
              >
                {formatResultsKey(key)}
              </H4>
              <XStack gap="$5" flexWrap="wrap">
                {results[key].map((item) => (
                  <SearchResultRow
                    key={item.send_id}
                    keyField={key as SearchResultsKeysType}
                    item={item}
                    query={query}
                  />
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

function SearchFilterButton({
  title,
  active,
  onPress,
}: { title: string; active: boolean; onPress: () => void }) {
  return (
    <Button
      height="$size.1.5"
      borderRadius="$2"
      $theme-light={{ bc: active ? '$primary' : '$networkDarkEthereum' }}
      $theme-dark={{ bc: active ? '$primary' : '$decay' }}
      chromeless
      onPress={onPress}
    >
      <ButtonText
        fontSize={'$4'}
        fontWeight={'500'}
        $theme-light={{ color: active ? '$black' : '$metalTouch' }}
        $theme-dark={{ color: active ? '$black' : '$white' }}
        textTransform="capitalize"
      >
        {title}
      </ButtonText>
    </Button>
  )
}

function SearchResultRow({
  keyField,
  item,
  query,
}: {
  keyField: SearchResultsKeysType
  item: SearchResultCommonType
  query: string
}) {
  const [params] = useSendScreenParams()
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
      <Link
        href={`/send?${new URLSearchParams({
          ...JSON.parse(JSON.stringify(params)), //JSON makes sure we don't pass undefined values
          recipient: item.tag_name,
        }).toString()}`}
      >
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
                    return ''
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

export function Search() {
  const { form } = useTagSearch()
  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$olive' : '$black'
  return (
    <View position="relative" testID="sendSearchContainer">
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
              placeholder: '$Sendtag, Phone, Send ID',
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
