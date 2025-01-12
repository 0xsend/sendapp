import type { Functions } from '@my/supabase/database.types'
import {
  Avatar,
  Button,
  ButtonText,
  Card,
  H4,
  isWeb,
  Paragraph,
  ScrollView,
  Spinner,
  Stack,
  Text,
  useMedia,
  View,
  XStack,
  YGroup,
  YStack,
} from '@my/ui'
import { ExternalLink } from '@tamagui/lucide-icons'
import { useThemeSetting } from '@tamagui/next-theme'
import { SearchSchema, useTagSearch } from 'app/provider/tag-search'
import { useRootScreenParams } from 'app/routers/params'
import { SchemaForm } from 'app/utils/SchemaForm'
import { shorten } from 'app/utils/strings'
import { useSearchResultHref } from 'app/utils/useSearchResultHref'
import * as Linking from 'expo-linking'
import { Fragment, useEffect, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { Adapt, Dialog, Sheet } from 'tamagui'
import { type Address, isAddress } from 'viem'
import { IconAccount, IconArrowRight, IconSearch, IconX } from './icons'
import { baseMainnet } from '@my/wagmi'
import { useEnsName } from 'wagmi'
import { useHoverStyles } from 'app/utils/useHoverStyles'

type SearchResultsType = Functions<'tag_search'>[number]
type SearchResultsKeysType = keyof SearchResultsType
export type SearchResultCommonType = SearchResultsType[SearchResultsKeysType][number]
const SEARCH_RESULTS_KEYS: SearchResultsKeysType[] = [
  'phone_matches',
  'tag_matches',
  'send_id_matches',
] as const
const formatResultsKey = (str: string): string => {
  return str
    .replace(/_matches/g, '')
    .replace(/_/g, ' ')
    .replace(/ id/g, ' ID')
}

function SearchResults() {
  const { results, isLoading, error } = useTagSearch()
  const [queryParams] = useRootScreenParams()
  const { search: query } = queryParams

  const [resultsFilter, setResultsFilter] = useState<SearchResultsKeysType | null>(null)
  if (isLoading) {
    return (
      <YStack key="loading" gap="$4" mt="$4" $gtLg={{ w: '50%' }}>
        <Spinner size="large" color="$olive" />
      </YStack>
    )
  }
  if (!results || error) {
    return null
  }

  if (isAddress(query ?? '')) {
    return (
      <View
        testID="searchResults"
        key="searchResults"
        animation="quick"
        gap="$size.2.5"
        width="100%"
        enterStyle={{
          opacity: 0,
          y: -10,
        }}
      >
        <YStack key={'results-eoa'} gap="$3.5">
          <H4
            $theme-dark={{ color: '$lightGrayTextField' }}
            $theme-light={{ color: '$darkGrayTextField' }}
            fontFamily={'$mono'}
            fontWeight={'500'}
            size={'$5'}
            textTransform="uppercase"
          >
            EOA
          </H4>
          <AddressSearchResultRow address={query as Address} />
        </YStack>
      </View>
    )
  }

  const matchesCount = Object.values(results).filter(
    (value) => Array.isArray(value) && value.length
  ).length
  if (matchesCount === 0) {
    return <Text mt="$4">No results for {query}... 😢</Text>
  }
  return (
    <ScrollView
      testID="searchResults"
      key="searchResults"
      animation="quick"
      gap="$size.2.5"
      width="100%"
      enterStyle={{
        opacity: 0,
        y: -10,
      }}
    >
      {query && matchesCount > 1 && (
        <YStack mb={'$4'}>
          <XStack gap="$5" mb={'$6'}>
            <SearchFilterButton
              title="All"
              active={!resultsFilter}
              onPress={() => setResultsFilter(null)}
            />
            {SEARCH_RESULTS_KEYS.map((key) =>
              Array.isArray(results[key]) && results[key].length ? (
                <SearchFilterButton
                  key={`filter-${key}`}
                  title={formatResultsKey(key)}
                  active={resultsFilter === key}
                  onPress={() => setResultsFilter(key as SearchResultsKeysType)}
                />
              ) : null
            )}
          </XStack>
          <Paragraph size={'$7'}>Search Results</Paragraph>
        </YStack>
      )}
      {query && (
        <YGroup
          bc={'$color1'}
          p={'$3'}
          $gtLg={{
            width: '50%',
          }}
        >
          {SEARCH_RESULTS_KEYS.map((key) =>
            Array.isArray(results[key]) &&
            results[key].length &&
            (!resultsFilter || resultsFilter === key) ? (
              <Fragment key={`results-${key}`}>
                {results[key].map((item: SearchResultCommonType) => (
                  <YGroup.Item key={`${key}-${item.tag_name}-${item.send_id}`}>
                    <SearchResultRow keyField={key as SearchResultsKeysType} profile={item} />
                  </YGroup.Item>
                ))}
              </Fragment>
            ) : null
          )}
        </YGroup>
      )}
    </ScrollView>
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
      fontSize="$5"
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
}: {
  title: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Button
      chromeless
      unstyled
      onPress={onPress}
      borderBottomColor={'$primary'}
      borderBottomWidth={active ? 1 : 0}
      $theme-light={{ borderBottomColor: '$color12' }}
    >
      <ButtonText
        color={active ? '$color12' : '$silverChalice'}
        textTransform="capitalize"
        size={'$5'}
      >
        {title}
      </ButtonText>
    </Button>
  )
}

const AddressSearchResultRow = ({ address }: { address: Address }) => {
  const href = useSearchResultHref()
  const { data: ensFromAddress, isLoading: isLoadingEns } = useEnsName({
    address,
  })

  const router = useRouter()
  const { gtMd } = useMedia()
  const [sendConfirmDialogIsOpen, setSendConfirmDialogIsOpen] = useState(false)

  return (
    <View
      br="$5"
      key={`SearchResultRow-${address}`}
      width="100%"
      testID="searchResults"
      $gtLg={{ width: '50%' }}
    >
      <Card
        testID={`tag-search-${address}`}
        display="flex"
        fd={'row'}
        p="$3"
        ai="center"
        jc={'space-between'}
        onPress={() => setSendConfirmDialogIsOpen(true)}
        role="link"
        aria-label={address}
      >
        <XStack ai="center" gap="$4">
          <Avatar size="$4.5" br="$3">
            <Avatar.Fallback
              f={1}
              jc={'center'}
              ai={'center'}
              backgroundColor={'$decay'}
              $theme-light={{ backgroundColor: '$white' }}
            >
              <IconAccount color="$olive" size={'$4'} />
            </Avatar.Fallback>
          </Avatar>
          <YStack gap="$1">
            <XStack gap="$3" ai={'center'}>
              <Paragraph
                fontWeight={'300'}
                $theme-light={{ color: '$darkGrayTextField' }}
                $theme-dark={{ color: '$lightGrayTextField' }}
                fontSize="$7"
                $gtSm={{ fontSize: '$5' }}
              >
                {ensFromAddress ?? 'External Address'}
              </Paragraph>
              {isLoadingEns && <Spinner size="small" color={'$color11'} />}
            </XStack>
            <Text
              fontSize="$4"
              ff={'$mono'}
              $theme-light={{ color: '$darkGrayTextField' }}
              $gtSm={{ fontSize: '$2' }}
            >
              {gtMd ? address : shorten(address, 6, 6)}
            </Text>
          </YStack>
        </XStack>
        <IconArrowRight
          size={'1.5'}
          color={'$primary'}
          $theme-light={{
            color: '$color12',
          }}
        />
      </Card>
      <ConfirmSendDialog
        isOpen={sendConfirmDialogIsOpen}
        onClose={() => setSendConfirmDialogIsOpen(false)}
        onConfirm={() => router.push(href)}
        address={address}
      />
    </View>
  )
}

function ConfirmSendDialog({ isOpen, onClose, onConfirm, address }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom open={isOpen} onOpenChange={onClose}>
          <Sheet.Frame padding="$4">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content gap="$4">
          <YStack gap="$4">
            <Dialog.Title>Confirm External Send</Dialog.Title>
            <Dialog.Description>
              Please confirm you agree to the following before sending:
            </Dialog.Description>
            <Paragraph>1. The external address is on Base Network.</Paragraph>

            <Paragraph>
              2. I have double checked the address:
              <Button
                size="$2"
                py="$4"
                theme="green"
                onPress={() => {
                  if (isWeb) {
                    window.open(
                      `${baseMainnet.blockExplorers.default.url}/address/${address}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  } else {
                    Linking.openURL(`${baseMainnet.blockExplorers.default.url}/address/${address}`)
                  }
                }}
                fontFamily={'$mono'}
                fontWeight={'bold'}
                iconAfter={<ExternalLink size={14} />}
                mt="$4"
              >
                {address}
              </Button>
            </Paragraph>

            <Paragraph>
              3. I understand that if I make any mistakes, there is no way to recover the funds.
            </Paragraph>

            <XStack justifyContent="flex-end" marginTop="$4" gap="$4">
              <Dialog.Close asChild>
                <Button br={'$2'}>Cancel</Button>
              </Dialog.Close>
              <Button theme="yellow_active" onPress={onConfirm} br={'$2'}>
                I Agree & Continue
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

function SearchResultRow({
  keyField,
  profile,
}: {
  keyField: SearchResultsKeysType
  profile: SearchResultCommonType
}) {
  const [queryParams] = useRootScreenParams()
  const { search: query } = queryParams
  const href = useSearchResultHref(profile)
  const hoverStyles = useHoverStyles()

  if (!query) return null

  return (
    <Stack
      br="$5"
      key={`SearchResultRow-${keyField}-${profile.tag_name}-${profile.send_id}`}
      width="100%"
      p={'$4'}
      hoverStyle={hoverStyles}
    >
      <Link href={href}>
        <XStack ai={'center'} jc={'space-between'}>
          <XStack testID={`tag-search-${profile.send_id}`} ai="center" gap="$4">
            <Avatar size="$4.5" br="$3">
              <Avatar.Image testID="avatar" src={profile.avatar_url} />
              <Avatar.Fallback>
                <Avatar size="$4.5" br="$3">
                  <Avatar.Image
                    src={`https://ui-avatars.com/api.jpg?name=${profile.tag_name}&size=256`}
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
                      return profile.phone
                    case 'tag_matches':
                      return profile.tag_name
                    case 'send_id_matches':
                      return `#${profile.send_id}`
                    default:
                      return ''
                  }
                })()}
                highlight={query}
              />
              <Text
                fontSize="$3"
                $theme-light={{ color: '$darkGrayTextField' }}
                textDecorationLine={'underline'}
              >
                {profile.tag_name ? `/${profile.tag_name}` : `#${profile.send_id}`}
              </Text>
            </YStack>
          </XStack>
          <IconArrowRight
            size={'1.5'}
            color={'$primary'}
            $theme-light={{
              color: '$color12',
            }}
          />
        </XStack>
      </Link>
    </Stack>
  )
}

type SearchProps = {
  label?: string
  placeholder?: string
}

function Search({ label, placeholder = 'Search' }: SearchProps) {
  const { form } = useTagSearch()
  const [queryParams, setRootParams] = useRootScreenParams()
  const { search: query } = queryParams

  const { resolvedTheme } = useThemeSetting()
  const borderColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$color12'

  useEffect(() => {
    const subscription = form.watch(({ query }) => {
      setRootParams(
        {
          ...queryParams,
          search: query === '' ? undefined : query,
        },
        { webBehavior: 'replace' }
      )
    })
    return () => subscription.unsubscribe()
  }, [form, setRootParams, queryParams])

  const handleClearClick = () => {
    form.setValue('query', '')
  }

  return (
    <>
      {label !== undefined && (
        <H4
          color="$gray11Light"
          fontFamily={'$mono'}
          fontWeight={'500'}
          size={'$5'}
          tt={'uppercase'}
        >
          {label}
        </H4>
      )}
      <View position="relative" testID="sendSearchContainer">
        <FormProvider {...form}>
          <SchemaForm
            form={form}
            defaultValues={{ query }}
            onSubmit={() => {
              // noop
            }}
            schema={SearchSchema}
            props={{
              query: {
                pr: '$size.3.5',
                pl: '$8',
                accessibilityRole: 'search',
                placeholder,
                fontWeight: 'normal',
                br: '$4',
                bw: 0,
                hoverStyle: {
                  bw: 0,
                },
                '$theme-dark': {
                  placeholderTextColor: '$silverChalice',
                },
                '$theme-light': {
                  placeholderTextColor: '$darkGrayTextField',
                },
                focusStyle: {
                  boc: borderColor,
                  bw: 1,
                  outlineWidth: 0,
                },
                fontSize: 17,
                iconBefore: (
                  <IconSearch
                    color={'$silverChalice'}
                    $theme-light={{ color: '$darkGrayTextField' }}
                  />
                ),
                iconAfter: query && (
                  <Button
                    chromeless
                    unstyled
                    cursor={'pointer'}
                    icon={
                      <IconX
                        color={'$silverChalice'}
                        $theme-light={{ color: '$darkGrayTextField' }}
                        size="$1"
                      />
                    }
                    onPress={handleClearClick}
                  />
                ),
              },
            }}
            formProps={{
              width: '100%',
              f: 1,
              als: 'center',
              $gtSm: {
                maxWidth: '100%',
              },
              $gtLg: {
                width: '50%',
                maxWidth: '50%',
                als: 'flex-start',
              },
            }}
          >
            {({ query }) => query}
          </SchemaForm>
        </FormProvider>
      </View>
    </>
  )
}

Search.Results = SearchResults
export default Search
