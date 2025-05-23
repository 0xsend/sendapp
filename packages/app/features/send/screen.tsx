import type { Functions } from '@my/supabase/database.types'
import {
  Anchor,
  AnimatePresence,
  Avatar,
  Button,
  Fade,
  H4,
  Label,
  LinkableAvatar,
  Paragraph,
  Spinner,
  Text,
  useToastController,
  XStack,
  YStack,
  type YStackProps,
} from '@my/ui'
import Search from 'app/components/SearchBar'
import { TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useState } from 'react'
import { SendAmountForm } from './SendAmountForm'
import { type Address, isAddress } from 'viem'
import { useRouter } from 'solito/router'
import { IconAccount } from 'app/components/icons'
import { shorten } from 'app/utils/strings'
import {
  useRecentSenders,
  type UseRecentSendersItem,
  type UseRecentSendersResult,
} from 'app/features/activity/utils/useRecentSenders'
import { Link } from 'solito/link'
import { FlatList } from 'react-native'

export const SendScreen = () => {
  const [{ recipient, idType }] = useSendScreenParams()
  const {
    data: profile,
    isLoading: isLoadingProfileLookup,
    error: errorProfileLookup,
  } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  const recentSendersQuery = useRecentSenders()
  const [{ search }] = useRootScreenParams()
  const isLoading = isLoadingProfileLookup || recentSendersQuery.isLoading

  if (isLoading) return <Spinner size="large" color={'$color12'} />

  if (errorProfileLookup) throw new Error(errorProfileLookup.message)

  if (idType === 'address' && isAddress(recipient as Address)) {
    return <SendAmountForm />
  }

  if (!profile)
    return (
      <TagSearchProvider>
        <YStack f={1} width={'100%'} pb="$4" gap="$6" $lg={{ pt: '$3' }}>
          <YStack width={'100%'} gap="$1.5" $gtSm={{ gap: '$2.5' }}>
            <Search autoFocus={true} />
          </YStack>
          {!search && <RecentSenders recentSendersQuery={recentSendersQuery} />}
          <SendSearchBody />
        </YStack>
      </TagSearchProvider>
    )

  if (!profile.address)
    // handle when user has no send account
    return <NoSendAccount profile={profile} />

  return <SendAmountForm />
}

function SendSearchBody() {
  const { isLoading, error } = useTagSearch()

  return (
    <AnimatePresence>
      {isLoading && (
        <YStack key="loading" gap="$4" mb="$4">
          <Spinner size="large" color="$send1" />
        </YStack>
      )}
      {error && (
        <YStack key="red" gap="$4" mb="$4">
          <H4 theme={'alt2'}>Error</H4>
          <Text>{error.message}</Text>
        </YStack>
      )}
      <Search.Results />
    </AnimatePresence>
  )
}

export function SendRecipient({ ...props }: YStackProps) {
  const [queryParams] = useSendScreenParams()
  const { recipient, idType } = queryParams
  const router = useRouter()
  const { data: profile, isLoading, error } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  const href = profile ? `/profile/${profile?.sendid}` : ''

  if (isLoading) return <Spinner size="large" />
  if (error) throw new Error(error.message)

  return (
    <YStack gap="$2.5" {...props}>
      <XStack jc="space-between" ai="center" gap="$3">
        <Label
          fontWeight="500"
          fontSize={'$5'}
          textTransform="uppercase"
          $theme-dark={{ col: '$gray8Light' }}
        >
          TO
        </Label>
        <Button
          bc="transparent"
          chromeless
          hoverStyle={{ bc: 'transparent' }}
          pressStyle={{ bc: 'transparent' }}
          focusStyle={{ bc: 'transparent' }}
          onPress={() =>
            router.push({
              pathname: '/send',
              query: { sendToken: queryParams.sendToken, amount: queryParams.amount },
            })
          }
        >
          <Button.Text $theme-dark={{ col: '$primary' }}>edit</Button.Text>
        </Button>
      </XStack>
      <XStack
        ai="center"
        gap="$3"
        bc="$metalTouch"
        p="$2"
        br="$3"
        $theme-light={{ bc: '$gray3Light' }}
      >
        <LinkableAvatar size="$4.5" br="$3" href={href}>
          <Avatar.Image src={profile?.avatar_url ?? ''} />
          <Avatar.Fallback jc="center">
            <IconAccount size="$4.5" color="$olive" />
          </Avatar.Fallback>
        </LinkableAvatar>
        <YStack gap="$1.5">
          <Paragraph fontSize="$4" fontWeight="500" color="$color12">
            {profile?.name}
          </Paragraph>
          <Paragraph
            fontFamily="$mono"
            fontSize="$4"
            fontWeight="400"
            lineHeight="$1"
            color="$color11"
          >
            {(() => {
              switch (true) {
                case idType === 'address':
                  return shorten(recipient, 5, 4)
                case !!profile?.tag:
                  return `/${profile?.tag}`
                default:
                  return `#${profile?.sendid}`
              }
            })()}
          </Paragraph>
        </YStack>
      </XStack>
    </YStack>
  )
}

function NoSendAccount({ profile }: { profile: Functions<'profile_lookup'>[number] }) {
  const toast = useToastController()
  const [clicked, setClicked] = useState(false)
  return (
    <YStack testID="NoSendAccount" gap="$4" mb="$4" maw={600} $lg={{ mx: 'auto' }} width={'100%'}>
      <SendRecipient width={'100%'} />
      <H4 theme={'alt2'} color="$olive">
        No send account
      </H4>
      <Anchor
        testID="NoSendAccountLink"
        href={`/profile/${profile.sendid}`}
        textDecorationLine="none"
        color="$color12"
      >
        <Text fontWeight="bold" display="flex" color="$color12">
          {(() => {
            if (profile.tag) return `/${profile.tag}`
            if (profile.name) return profile.name
            return `#${profile.sendid}`
          })()}
        </Text>
        <Text display="flex" color="$color12">
          {' '}
          has no send account! Ask them to create one or write a /send Check.
        </Text>
      </Anchor>

      <Button
        mx="auto"
        miw="$16"
        maw="$20"
        disabled={clicked}
        onPress={() => {
          setClicked(true)
          console.error('TODO: create send account')
          toast.show('Coming soon')
        }}
      >
        Write /send Check
      </Button>
      {clicked && (
        <Fade>
          <Paragraph width={'100%'} textAlign="center" color="$color12">
            <Text>/send Checks Coming Soon</Text>
          </Paragraph>
        </Fade>
      )}
    </YStack>
  )
}

const RecentSenders = ({ recentSendersQuery }: { recentSendersQuery: UseRecentSendersResult }) => {
  const { error, data } = recentSendersQuery
  const [sendParams] = useSendScreenParams()
  const _sendParams = JSON.parse(JSON.stringify(sendParams)) //JSON makes sure we don't pass undefined values

  const renderItem = ({ item, index }: { item: UseRecentSendersItem; index: number }) => {
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
                renderItem={renderItem}
                keyExtractor={(item, index) => item?.send_id?.toString() ?? String(index)}
                showsHorizontalScrollIndicator={false}
              />
            )
        }
      })()}
    </YStack>
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
