import type { Functions } from '@my/supabase/database.types'
import {
  Avatar,
  Button,
  ButtonText,
  Card,
  H4,
  Paragraph,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
  isWeb,
  useMedia,
} from '@my/ui'
import { ExternalLink } from '@tamagui/lucide-icons'
import { useThemeSetting } from '@tamagui/next-theme'
import { SearchSchema, useTagSearch } from 'app/provider/tag-search'
import { useRootScreenParams } from 'app/routers/params'
import { SchemaForm } from 'app/utils/SchemaForm'
import { shorten } from 'app/utils/strings'
import { useSearchResultHref } from 'app/utils/useSearchResultHref'
import * as Linking from 'expo-linking'
import { useEffect, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { Adapt, Dialog, Sheet } from 'tamagui'
import { type Address, isAddress } from 'viem'
import { IconAccount, IconSearch } from './icons'
import { baseMainnet } from '@my/wagmi'
import { useEnsName } from 'wagmi'

type SearchResultsType = Functions<'tag_search'>[number]
type SearchResultsKeysType = keyof SearchResultsType
export type SearchResultCommonType = SearchResultsType[SearchResultsKeysType][number]
const SEARCH_RESULTS_KEYS: SearchResultsKeysType[] = [
  'phone_matches',
  'tag_matches',
  'send_id_matches',
] as const
const formatResultsKey = (str: string): string => {
  return str.replace(/_matches/g, '').replace(/_/g, ' ')
}

function SearchResults() {
  const { results, isLoading, error } = useTagSearch()
  const [queryParams] = useRootScreenParams()
  const { search: query } = queryParams

  const [resultsFilter, setResultsFilter] = useState<SearchResultsKeysType | null>(null)
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
                key={`filter-${key}`}
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
          <YStack key={`results-${key}`} gap="$3.5">
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
              {results[key].map((item: SearchResultCommonType) => (
                <SearchResultRow
                  key={`${key}-${item.tag_name}-${item.send_id}`}
                  keyField={key as SearchResultsKeysType}
                  profile={item}
                />
              ))}
            </XStack>
          </YStack>
        ) : null
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

const AddressSearchResultRow = ({ address }: { address: Address }) => {
  const href = useSearchResultHref()
  const { data: ensFromAddress, isLoading: isLoadingEns } = useEnsName({
    address,
  })

  const router = useRouter()
  const { gtMd } = useMedia()
  const [sendConfirmDialogIsOpen, setSendConfirmDialogIsOpen] = useState(false)

  return (
    <View br="$5" key={`SearchResultRow-${address}`} width="100%" testID="searchResults">
      <Card
        testID={`tag-search-${address}`}
        ai="center"
        gap="$4"
        display="flex"
        fd={'row'}
        p="$3"
        onPress={() => setSendConfirmDialogIsOpen(true)}
        role="link"
        aria-label={address}
      >
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

  const { resolvedTheme } = useThemeSetting()
  const rowBC = resolvedTheme?.startsWith('dark') ? '$metalTouch' : '$gray2Light'

  if (!query) return null

  return (
    <View
      br="$5"
      key={`SearchResultRow-${keyField}-${profile.tag_name}-${profile.send_id}`}
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
      <Link href={href}>
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
              fontSize="$4"
              ff={'$mono'}
              $theme-light={{ color: '$darkGrayTextField' }}
              $gtSm={{ fontSize: '$2' }}
            >
              {profile.tag_name ? `/${profile.tag_name}` : `#${profile.send_id}`}
            </Text>
          </YStack>
        </XStack>
      </Link>
    </View>
  )
}

type SearchProps = {
  label?: string
  placeholder?: string
}

function Search({ label, placeholder = 'Sendtag, Phone, Send ID, Address' }: SearchProps) {
  const { form } = useTagSearch()
  const [queryParams, setRootParams] = useRootScreenParams()
  const { search: query } = queryParams

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

  return (
    <>
      {label !== undefined && (
        <H4 color="$gray11Light" fontFamily={'$mono'} fontWeight={'500'} size={'$5'}>
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
                hoverStyle: {
                  boc: '$color12',
                },
                bw: 1,
                br: '$4',
                boc: '$color3',
                $gtLg: {
                  w: 455,
                },
                iconBefore: <IconSearch />,
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
      </View>
    </>
  )
}

Search.Results = SearchResults
export default Search
