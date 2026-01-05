import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Button,
  Fade,
  H4,
  LazyMount,
  Paragraph,
  Spinner,
  Stack,
  useThemeName,
  View,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import { Check, Copy, Pencil, UserPlus } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'
import type { Address } from 'viem'
import { FlatList } from 'react-native'
import { IconArrowUp, IconArrowRight, IconHeart, IconHeartOutline } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { useSendScreenParams } from 'app/routers/params'
import { SendChat } from 'app/features/send/components/SendChat'
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
import { useContactByExternalAddress } from 'app/features/contacts/hooks/useContactByExternalAddress'
import {
  useAddExternalContact,
  useToggleContactFavorite,
} from 'app/features/contacts/hooks/useContactMutation'
import { ContactDetailSheet } from 'app/features/contacts/components/ContactDetailSheet'

interface ExternalAddressScreenProps {
  address: Address
}

export function ExternalAddressScreen({ address }: ExternalAddressScreenProps) {
  const toast = useAppToast()
  const isDark = useThemeName()?.startsWith('dark')
  const [hasCopied, setHasCopied] = useState(false)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)
  const [sendChatOpen, setSendChatOpen] = useState(false)
  const [sendParams, setSendParams] = useSendScreenParams()
  const { user } = useUser()

  // Open SendChat when params are set
  useEffect(() => {
    if (sendParams.idType && sendParams.recipient) {
      setSendChatOpen(true)
    }
  }, [sendParams.idType, sendParams.recipient])

  // Clear params when SendChat closes
  // biome-ignore lint/correctness/useExhaustiveDependencies: only trigger when sendChatOpen changes
  useEffect(() => {
    if (!sendChatOpen) {
      setSendParams({
        idType: undefined,
        recipient: undefined,
        note: undefined,
        amount: sendParams.amount,
        sendToken: sendParams.sendToken,
      })
    }
  }, [sendChatOpen])
  const supabase = useSupabase()
  const { selectActivity, isOpen } = useActivityDetails()

  // Contact state
  const { data: existingContact, refetch: refetchContact } = useContactByExternalAddress(address)
  const isContact = !!existingContact
  const isFavorite = existingContact?.is_favorite ?? false

  // Contact mutations
  const { mutate: addExternalContact, isPending: isAddingContact } = useAddExternalContact()
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleContactFavorite()

  // Handle add contact button
  const handleAddContact = useCallback(() => {
    addExternalContact(
      {
        externalAddress: address,
        chainId: 'eip155:8453', // Base mainnet
      },
      {
        onSuccess: () => {
          toast.show('Contact added')
          refetchContact()
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  }, [address, addExternalContact, toast, refetchContact])

  // Handle favorite button
  const handleToggleFavorite = useCallback(() => {
    if (!existingContact?.contact_id) return

    toggleFavorite(
      { contactId: existingContact.contact_id },
      {
        onSuccess: () => {
          toast.show(isFavorite ? 'Removed from favorites' : 'Added to favorites')
          refetchContact()
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  }, [existingContact, isFavorite, toggleFavorite, toast, refetchContact])

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

  // Determine if an activity was sent by the current user or received from the external address
  const isSent = (activity: Activity) => {
    const toAddress = activity.data.t
    const senderAddress = 'sender' in activity.data ? activity.data.sender : undefined
    if (toAddress?.toLowerCase() === address.toLowerCase()) return true
    if (senderAddress?.toLowerCase() === address.toLowerCase()) return false
    return false
  }

  // Display name: use contact custom_name if available, otherwise "External Address"
  const displayName = existingContact?.custom_name || 'External Address'

  return (
    <XStack w="100%" gap="$5" f={1}>
      <YStack
        f={1}
        display={isOpen ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
        }}
      >
        {/* Profile Header */}
        <YStack gap="$3" mb="$5">
          <H4 size="$7" fontWeight="400" color="$color12" testID="externalAddress">
            {displayName}
          </H4>

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
            als="flex-start"
            onPress={copyToClipboard}
            testID="copyAddressButton"
          >
            <XStack gap="$2" ai="center">
              <Paragraph fontSize="$5" fontFamily="$mono" color="$color11">
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

          {/* Action Buttons */}
          <XStack gap="$3" mt="$2">
            {/* Send Button */}
            <Button
              onPress={() => {
                setSendParams({
                  ...sendParams,
                  recipient: address,
                  idType: 'address',
                })
                setSendChatOpen(true)
              }}
              borderRadius="$4"
              jc="center"
              ai="center"
              bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              testID="externalAddressSendButton"
              px="$4"
            >
              <Button.Icon>
                <IconArrowUp size="$1" color={isDark ? '$primary' : '$color12'} />
              </Button.Icon>
              <Button.Text color="$color12" fontSize="$4" fontWeight="400" textAlign="center">
                Send
              </Button.Text>
            </Button>
            {/* Add contact / favorite / edit buttons (only show when logged in) */}
            {user &&
              (isContact ? (
                <>
                  <Button
                    testID="externalAddressToggleFavoriteButton"
                    aspectRatio={1}
                    p={0}
                    br="$4"
                    bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    onPress={handleToggleFavorite}
                    disabled={isTogglingFavorite}
                    icon={
                      isTogglingFavorite ? (
                        <Spinner size="small" />
                      ) : isFavorite ? (
                        <IconHeart size="$1" color="$red9" />
                      ) : (
                        <IconHeartOutline size="$1" color="$color12" />
                      )
                    }
                  />
                  <Button
                    testID="externalAddressEditContactButton"
                    aspectRatio={1}
                    p={0}
                    br="$4"
                    bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    onPress={() => setContactSheetOpen(true)}
                    icon={<Pencil size="$1" color="$color12" />}
                  />
                </>
              ) : (
                <Button
                  testID="externalAddressAddContactButton"
                  aspectRatio={1}
                  p={0}
                  br="$4"
                  bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                  onPress={handleAddContact}
                  disabled={isAddingContact}
                  icon={
                    isAddingContact ? (
                      <Spinner size="small" />
                    ) : (
                      <UserPlus size="$1" color="$color12" />
                    )
                  }
                />
              ))}
          </XStack>
        </YStack>

        {/* Activity Feed Section */}
        <YStack f={1}>
          <H4 size="$7" fontWeight="400" py="$3.5" color="$gray11">
            Activity
          </H4>

          {!user ? (
            <View bc="$color1" br="$4" p="$4">
              <Paragraph color="$color10" fontSize="$4" textAlign="center">
                Sign in to view your activity with this address.
              </Paragraph>
            </View>
          ) : isLoading ? (
            <Stack ai="center" jc="center" p="$4">
              <Spinner size="large" color="$primary" />
            </Stack>
          ) : error ? (
            <View bc="$color1" br="$4" p="$4">
              <Paragraph color="$color10" fontSize="$4" textAlign="center" theme="red">
                Error loading activity.
              </Paragraph>
            </View>
          ) : activities.length === 0 ? (
            <View bc="$color1" br="$4" p="$4">
              <YStack gap="$2" ai="center">
                <Paragraph color="$color10" fontSize="$4" textAlign="center">
                  No transaction history
                </Paragraph>
                <Paragraph color="$color10" fontSize="$3" textAlign="center">
                  Send to this address to start tracking activity.
                </Paragraph>
              </YStack>
            </View>
          ) : (
            <View br="$4" ov="hidden">
              <FlatList<Activity>
                testID="ExternalAddressActivityFeed"
                style={{ flex: 1 }}
                data={activities}
                keyExtractor={(activity) => activity.event_id}
                renderItem={({ item: activity, index }) => {
                  const sent = isSent(activity)
                  const isFirst = index === 0
                  const isLast = index === activities.length - 1
                  return (
                    <Fade>
                      <ActivityRow
                        activity={activity}
                        sent={sent}
                        onPress={() => selectActivity(activity)}
                        isFirst={isFirst}
                        isLast={isLast}
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
            </View>
          )}
        </YStack>
      </YStack>

      {/* Activity Details Side Panel (desktop) */}
      {isOpen && (
        <ActivityDetails
          w={'100%'}
          $platform-web={{
            height: 'fit-content',
            position: 'sticky',
            top: 10,
          }}
          $gtLg={{
            maxWidth: '47%',
          }}
        />
      )}

      {/* Contact Detail Sheet for editing */}
      {existingContact && (
        <ContactDetailSheet
          contact={existingContact}
          open={contactSheetOpen}
          onOpenChange={setContactSheetOpen}
          onUpdate={refetchContact}
          hideNavButtons
        />
      )}

      {/* SendChat panel */}
      <LazyMount when={sendChatOpen}>
        <SendChat open={sendChatOpen} onOpenChange={setSendChatOpen} />
      </LazyMount>
    </XStack>
  )
}

// Simplified activity row for the inline feed (styled like RecentActivityFeed)
const ActivityRow = ({
  activity,
  sent,
  onPress,
  isFirst,
  isLast,
}: {
  activity: Activity
  sent: boolean
  onPress: () => void
  isFirst: boolean
  isLast: boolean
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
    <YStack
      bc="$color1"
      p="$3"
      {...(isFirst && {
        borderTopLeftRadius: '$4',
        borderTopRightRadius: '$4',
      })}
      {...(isLast && {
        borderBottomLeftRadius: '$4',
        borderBottomRightRadius: '$4',
      })}
    >
      <XStack
        testID="activityRow"
        jc="space-between"
        ai="center"
        onPress={onPress}
        cursor="pointer"
        hoverStyle={{ opacity: 0.8 }}
        pressStyle={{ opacity: 0.7 }}
        py="$2"
      >
        <XStack gap="$3" ai="center">
          <XStack w={40} h={40} br="$10" bc={sent ? '$red3' : '$green3'} ai="center" jc="center">
            <IconArrowRight
              size="$1"
              rotate={sent ? '-90deg' : '90deg'}
              color={sent ? '$red10' : '$green10'}
            />
          </XStack>
          <YStack>
            <Paragraph size="$4" color="$color12" fontWeight="500">
              {sent ? 'Sent' : 'Received'}
            </Paragraph>
            <Paragraph size="$3" color="$color10">
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
        <Paragraph size="$5" color="$color12" fontWeight="500">
          {amount}
        </Paragraph>
      </XStack>
    </YStack>
  )
}
