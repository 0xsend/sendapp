import { useState, useMemo } from 'react'
import {
  Anchor,
  Button,
  Card,
  Fade,
  H3,
  Link,
  Paragraph,
  Spinner,
  Stack,
  useMedia,
  useThemeName,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import { Check, Copy, ExternalLink } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'
import type { Address } from 'viem'
import { FlatList } from 'react-native'
import { IconArrowUp, IconArrowRight } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useInfiniteQuery } from '@tanstack/react-query'
import { throwIf } from 'app/utils/throwIf'
import { EventArraySchema, Events, type Activity } from 'app/utils/zod/activity'
import { amountFromActivity } from 'app/utils/activity'
import { hexToBytea } from 'app/utils/hexToBytea'
import {
  isTemporalEthTransfersEvent,
  isTemporalTokenTransfersEvent,
} from 'app/utils/zod/activity/TemporalTransfersEventSchema'
import type { PropsWithChildren } from 'react'

interface ExternalAddressHistoryScreenProps {
  address: Address
}

export function ExternalAddressHistoryScreen({ address }: ExternalAddressHistoryScreenProps) {
  const media = useMedia()
  const toast = useAppToast()
  const isDark = useThemeName()?.startsWith('dark')
  const [hasCopied, setHasCopied] = useState(false)
  const { user } = useUser()
  const supabase = useSupabase()

  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  // Convert address to bytea format for querying
  const addressBytea = useMemo(() => hexToBytea(address), [address])

  // Fetch activity involving this address from the user's activity feed
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<Activity[], Error>({
      queryKey: ['external_address_activity', address, user?.id],
      initialPageParam: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        if (!lastPage || lastPage.length < 10) return undefined
        return (lastPageParam as number) + 1
      },
      queryFn: async ({ pageParam }): Promise<Activity[]> => {
        const page = pageParam as number
        const from = page * 10
        const to = (page + 1) * 10 - 1

        // Query activity_feed for activities where the external address appears in data.f, data.t, or data.sender
        // - data.f/data.t: used by SendAccountTransfers and token TemporalSendAccountTransfers
        // - data.sender: used by SendAccountReceive and ETH TemporalSendAccountTransfers
        const { data: activities, error } = await supabase
          .from('activity_feed')
          .select('*')
          .or(
            `data->>f.eq.${addressBytea},data->>t.eq.${addressBytea},data->>sender.eq.${addressBytea}`
          )
          .in('event_name', [
            Events.SendAccountTransfers,
            Events.SendAccountReceive,
            Events.TemporalSendAccountTransfers,
          ])
          .order('created_at', { ascending: false })
          .range(from, to)

        throwIf(error)
        return EventArraySchema.parse(activities)
      },
      enabled: !!user, // Only query if user is logged in
    })

  const activities = useMemo(() => data?.pages?.flat() ?? [], [data])

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(address).catch(() => toast.error('Failed to copy address'))
    setHasCopied(true)
    toast.show('Address copied')
    setTimeout(() => setHasCopied(false), 2000)
  }

  // Block explorer URL for Base chain
  const blockExplorerUrl = `https://basescan.org/address/${address}`

  // Determine if an activity was sent by the current user or received from the external address
  const isSent = (activity: Activity) => {
    // After parsing, data.t and data.sender are hex addresses (transformed by byteaToHexEthAddress)
    // For transfer events: if external address is in 'to' field, current user sent TO them
    // For receive events: if external address is in 'sender' field, they sent TO us (so we received)
    const toAddress = activity.data.t
    const senderAddress = 'sender' in activity.data ? activity.data.sender : undefined
    // If external address is the recipient (data.t), we sent to them
    // If external address is the sender (data.sender), we received from them (not sent)
    if (toAddress?.toLowerCase() === address.toLowerCase()) return true
    if (senderAddress?.toLowerCase() === address.toLowerCase()) return false
    return false
  }

  return (
    <YStack gap="$4" ai="center" w="100%" maw={1024} p="$4" f={1}>
      <Card gap="$4" size={media.gtMd ? '$7' : '$5'} padded elevation={1} w="100%">
        {/* Address Display */}
        <YStack gap="$3" ai="center">
          <H3 lineHeight={32} color="$color12" testID="externalAddressHistory">
            Address History
          </H3>

          {/* Address with Copy Button */}
          <Button
            chromeless
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{
              backgroundColor: 'transparent',
              borderColor: 'transparent',
            }}
            focusStyle={{ backgroundColor: 'transparent' }}
            p={0}
            height="auto"
            onPress={copyToClipboard}
            testID="copyAddressButton"
          >
            <XStack gap="$2" ai="center">
              <Paragraph fontSize="$6" fontFamily="$mono" color="$color12">
                {truncatedAddress}
              </Paragraph>
              {hasCopied ? (
                <Check color="$primary" size="$1" $theme-light={{ color: '$color12' }} />
              ) : (
                <Copy
                  flexShrink={0}
                  size="$1"
                  color="$primary"
                  $theme-light={{ color: '$color12' }}
                />
              )}
            </XStack>
          </Button>
        </YStack>

        {/* Activity Section */}
        <YStack gap="$3" w="100%" f={1} minHeight={200}>
          {!user ? (
            // Not logged in
            <YStack gap="$3" ai="center" p="$6">
              <Paragraph color="$color10" fontSize="$5" textAlign="center">
                Sign in to view your activity with this address.
              </Paragraph>
            </YStack>
          ) : isLoading ? (
            <Stack ai="center" jc="center" p="$6">
              <Spinner size="large" color="$primary" />
            </Stack>
          ) : error ? (
            <YStack gap="$3" ai="center" p="$6">
              <Paragraph color="$color10" fontSize="$5" textAlign="center" theme="red">
                Error loading activity.
              </Paragraph>
            </YStack>
          ) : activities.length === 0 ? (
            <YStack gap="$3" ai="center" p="$6">
              <Paragraph color="$color10" fontSize="$5" textAlign="center">
                No Send activity with this address.
              </Paragraph>
              <Paragraph color="$color10" fontSize="$4" textAlign="center">
                Transactions you send to or receive from this address will appear here.
              </Paragraph>
            </YStack>
          ) : (
            <FlatList<Activity>
              testID="ExternalAddressActivityFeed"
              style={{ flex: 1 }}
              data={activities}
              keyExtractor={(activity) => activity.event_id}
              renderItem={({ item: activity, index }) => {
                const date = activity.created_at.toLocaleDateString()
                const nextDate = activities[index + 1]?.created_at.toLocaleDateString()
                const shouldShowDatePill = !nextDate || date !== nextDate
                const sent = isSent(activity)

                return (
                  <>
                    <Fade>
                      <TransactionEntry activity={activity} sent={sent} />
                    </Fade>
                    {shouldShowDatePill ? <DatePill date={date} /> : null}
                  </>
                )
              }}
              onEndReached={() => fetchNextPage()}
              ListFooterComponent={
                hasNextPage || isFetchingNextPage ? (
                  <Spinner size="small" color="$color12" my="$4" />
                ) : null
              }
              inverted={true}
              showsVerticalScrollIndicator={false}
            />
          )}
        </YStack>

        {/* Action Buttons */}
        <XStack w="100%" gap="$4" jc="center">
          {/* Send Button */}
          <Link href={`/send?recipient=${address}&idType=address`} asChild>
            <Button
              borderRadius="$4"
              jc="center"
              ai="center"
              bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              testID="externalAddressSendButton"
            >
              <Button.Icon>
                <IconArrowUp size="$1" color={isDark ? '$primary' : '$color12'} />
              </Button.Icon>
              <Button.Text color="$color12" fontSize="$4" fontWeight="400" textAlign="center">
                Send to this address
              </Button.Text>
            </Button>
          </Link>
        </XStack>

        {/* Links */}
        <XStack w="100%" gap="$4" jc="center">
          {/* Back to Profile Link */}
          <Link
            href={`/profile/${address}`}
            textDecorationLine="underline"
            fontSize="$4"
            color="$color10"
          >
            Back to Profile
          </Link>

          {/* Block Explorer Link */}
          <Anchor
            href={blockExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            textDecorationLine="underline"
            fontSize="$4"
            color="$color10"
          >
            <XStack gap="$1" ai="center">
              <Paragraph color="$color10">View on Basescan</Paragraph>
              <ExternalLink size={14} color="$color10" />
            </XStack>
          </Anchor>
        </XStack>
      </Card>
    </YStack>
  )
}

const TransactionEntry = ({
  activity,
  sent,
}: {
  activity: Activity
  sent: boolean
}) => {
  const {
    data: { note },
  } = activity
  const amount = amountFromActivity(activity)
  const date = useTransactionEntryDate({ activity, sent })

  return (
    <XStack justifyContent={sent ? 'flex-end' : 'flex-start'} testID="activityEntry" my="$2.5">
      <YStack gap="$1">
        <YStack
          bg="$color1"
          p="$4"
          br="$4"
          maxWidth={300}
          gap="$3"
          ai={sent ? 'flex-end' : 'flex-start'}
        >
          <XStack
            gap="$3"
            ai="center"
            fd={sent ? 'row-reverse' : 'row'}
            style={{ width: 'max-content' }}
            alignSelf={sent ? 'flex-end' : 'flex-start'}
          >
            <YStack>
              <XStack gap="$2" ai="center" fd={sent ? 'row-reverse' : 'row'}>
                {!sent && <IconArrowRight size="$0.9" rotate="90deg" color="$olive" />}
                <Paragraph size="$3" color="$color8" theme={sent ? 'red' : 'green'}>
                  You {sent ? 'Sent' : 'Received'}
                </Paragraph>
                {sent && <IconArrowRight size="$0.9" rotate="-90deg" color="$red10Dark" />}
              </XStack>
              <Paragraph size="$7">{amount}</Paragraph>
            </YStack>
          </XStack>
          {note && (
            <Paragraph
              fontSize={17}
              color="$silverChalice"
              w="100%"
              whiteSpace="pre-wrap"
              $theme-light={{
                color: '$darkGrayTextField',
              }}
            >
              {decodeURIComponent(note)}
            </Paragraph>
          )}
        </YStack>
        <XStack jc={sent ? 'flex-end' : 'flex-start'}>{date}</XStack>
      </YStack>
    </XStack>
  )
}

const DatePill = ({ date }: { date: string }) => {
  return (
    <Paragraph
      ff="$mono"
      textAlign="center"
      size="$4"
      py="$0.25"
      bc="$background"
      color="$color10"
      px="$0.9"
      br="$2"
    >
      {date}
    </Paragraph>
  )
}

const useTransactionEntryDate = ({ activity, sent }: { activity: Activity; sent: boolean }) => {
  const { created_at, data } = activity
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)

  if (isTemporalTransfer) {
    switch (data.status) {
      case 'failed':
      case 'cancelled':
        return <DateText sent={sent}>Failed</DateText>
      case 'confirmed':
        return (
          <DateText sent={sent}>
            {new Date(created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </DateText>
        )
      default:
        return <Spinner size="small" color="$color11" />
    }
  }

  return (
    <DateText sent={sent}>
      {new Date(created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </DateText>
  )
}

const DateText = ({ children, sent }: PropsWithChildren & { sent: boolean }) => {
  return (
    <Paragraph
      display="flex"
      size="$2"
      ta={sent ? 'right' : 'left'}
      color="$darkGrayTextField"
      $theme-light={{ color: '$silverChalice' }}
    >
      {children}
    </Paragraph>
  )
}
