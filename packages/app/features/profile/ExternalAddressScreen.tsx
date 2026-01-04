import { useState, useMemo, useCallback } from 'react'
import {
  Anchor,
  Button,
  Card,
  Fade,
  H3,
  H4,
  Link,
  Paragraph,
  Spinner,
  Stack,
  Text,
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
import { useActivityDetails } from 'app/provider/activity-details'
import { ActivityDetails } from 'app/features/activity/ActivityDetails'

interface ExternalAddressScreenProps {
  address: Address
}

export function ExternalAddressScreen({ address }: ExternalAddressScreenProps) {
  const media = useMedia()
  const toast = useAppToast()
  const isDark = useThemeName()?.startsWith('dark')
  const [hasCopied, setHasCopied] = useState(false)
  const { user } = useUser()
  const supabase = useSupabase()
  const { selectActivity, isOpen } = useActivityDetails()

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
        if (!lastPage || lastPage.length < 20) return undefined
        return (lastPageParam as number) + 1
      },
      queryFn: async ({ pageParam }): Promise<Activity[]> => {
        const page = pageParam as number
        const from = page * 20
        const to = (page + 1) * 20 - 1

        // Query activity_feed for activities where the external address appears in data.f, data.t, or data.sender
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
    const toAddress = activity.data.t
    const senderAddress = 'sender' in activity.data ? activity.data.sender : undefined
    if (toAddress?.toLowerCase() === address.toLowerCase()) return true
    if (senderAddress?.toLowerCase() === address.toLowerCase()) return false
    return false
  }

  return (
    <YStack gap="$4" ai="center" w="100%" maw={1024} p="$4" f={1}>
      <Card gap="$4" size={media.gtMd ? '$7' : '$5'} padded elevation={1} w="100%">
        {/* Address Display */}
        <YStack gap="$3" ai="center">
          <H3 lineHeight={32} color="$color12" testID="externalAddress">
            External Address
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

          <Paragraph fontSize="$2" color="$color10" fontFamily="$mono">
            {address}
          </Paragraph>
        </YStack>

        {/* Action Buttons */}
        <XStack w="100%" gap="$4">
          {/* Send Button */}
          <Link href={`/send?recipient=${address}&idType=address`} asChild f={1}>
            <Button
              borderRadius="$4"
              jc="center"
              ai="center"
              bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              f={1}
              testID="externalAddressSendButton"
            >
              <Button.Icon>
                <IconArrowUp size="$1" color={isDark ? '$primary' : '$color12'} />
              </Button.Icon>
              <Button.Text color="$color12" fontSize="$4" fontWeight="400" textAlign="center">
                Send
              </Button.Text>
            </Button>
          </Link>
        </XStack>

        {/* Activity Feed Section */}
        <YStack gap="$3" w="100%" minHeight={200}>
          <H4 size="$5" color="$color12" fontWeight="500">
            Activity
          </H4>

          {!user ? (
            <YStack gap="$3" ai="center" p="$4">
              <Paragraph color="$color10" fontSize="$4" textAlign="center">
                Sign in to view your activity with this address.
              </Paragraph>
            </YStack>
          ) : isLoading ? (
            <Stack ai="center" jc="center" p="$4">
              <Spinner size="large" color="$primary" />
            </Stack>
          ) : error ? (
            <YStack gap="$3" ai="center" p="$4">
              <Paragraph color="$color10" fontSize="$4" textAlign="center" theme="red">
                Error loading activity.
              </Paragraph>
            </YStack>
          ) : activities.length === 0 ? (
            <YStack gap="$2" ai="center" p="$4">
              <Paragraph color="$color10" fontSize="$4" textAlign="center">
                No transaction history
              </Paragraph>
              <Paragraph color="$color10" fontSize="$3" textAlign="center">
                Send to this address to start tracking activity.
              </Paragraph>
            </YStack>
          ) : (
            <YStack gap="$2" maxHeight={400}>
              <FlatList<Activity>
                testID="ExternalAddressActivityFeed"
                style={{ flex: 1 }}
                data={activities}
                keyExtractor={(activity) => activity.event_id}
                renderItem={({ item: activity }) => {
                  const sent = isSent(activity)
                  return (
                    <Fade>
                      <ActivityRow
                        activity={activity}
                        sent={sent}
                        onPress={() => selectActivity(activity)}
                      />
                    </Fade>
                  )
                }}
                onEndReached={() => {
                  if (hasNextPage) fetchNextPage()
                }}
                ListFooterComponent={
                  hasNextPage || isFetchingNextPage ? (
                    <Spinner size="small" color="$color12" my="$2" />
                  ) : null
                }
                showsVerticalScrollIndicator={false}
              />
            </YStack>
          )}
        </YStack>

        {/* Links */}
        <XStack w="100%" gap="$4" jc="center">
          {/* History Link */}
          <Link
            href={`/profile/${address}/history`}
            textDecorationLine="underline"
            fontSize="$4"
            color="$color10"
          >
            View Full History
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
              <Text color="$color10">Basescan</Text>
              <ExternalLink size={14} color="$color10" />
            </XStack>
          </Anchor>
        </XStack>
      </Card>

      {/* Activity Details Modal */}
      {isOpen && (
        <YStack
          $gtLg={{
            display: 'flex',
            maxWidth: '50%',
            pb: '$3.5',
          }}
        >
          <ActivityDetails />
        </YStack>
      )}
    </YStack>
  )
}

// Simplified activity row for the inline feed
const ActivityRow = ({
  activity,
  sent,
  onPress,
}: {
  activity: Activity
  sent: boolean
  onPress: () => void
}) => {
  const amount = amountFromActivity(activity)
  const date = activity.created_at.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const time = activity.created_at.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
  const isPending = isTemporalTransfer && activity.data.status !== 'confirmed'
  const isFailed =
    isTemporalTransfer &&
    (activity.data.status === 'failed' || activity.data.status === 'cancelled')

  return (
    <XStack
      testID="activityRow"
      p="$3"
      bc="$color1"
      br="$3"
      my="$1"
      jc="space-between"
      ai="center"
      onPress={onPress}
      cursor="pointer"
      hoverStyle={{ opacity: 0.8 }}
      pressStyle={{ opacity: 0.7 }}
    >
      <XStack gap="$2" ai="center">
        <XStack w={32} h={32} br="$10" bc={sent ? '$red3' : '$green3'} ai="center" jc="center">
          <IconArrowRight
            size="$0.75"
            rotate={sent ? '-90deg' : '90deg'}
            color={sent ? '$red10' : '$green10'}
          />
        </XStack>
        <YStack>
          <Paragraph size="$3" color="$color12" fontWeight="500">
            {sent ? 'Sent' : 'Received'}
          </Paragraph>
          <Paragraph size="$2" color="$color10">
            {isPending ? (
              <Spinner size="small" color="$color10" />
            ) : isFailed ? (
              'Failed'
            ) : (
              `${date} ${time}`
            )}
          </Paragraph>
        </YStack>
      </XStack>
      <Paragraph size="$4" color="$color12" fontWeight="500">
        {amount}
      </Paragraph>
    </XStack>
  )
}
