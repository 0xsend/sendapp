import type { Database } from '@my/supabase/database.types'
import { sendtagCheckoutAddress } from '@my/wagmi'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { ContractLabels } from 'app/data/contract-labels'
import { getBaseAddressFilterCondition } from 'app/utils/activity'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useAddressBook, type AddressBook } from 'app/utils/useAddressBook'
import { EventArraySchema, Events, type Activity } from 'app/utils/zod/activity'
import { useMemo } from 'react'
import type { ZodError } from 'zod'

const sendtagCheckoutAddresses = Object.values(sendtagCheckoutAddress)

/**
 * Creates a grouped activity from multiple SendAccountTransfers from the same sender.
 * Shows only the most recent transfer's value and note.
 */
function createGroupedTransferActivity(transfers: Activity[]): Activity {
  // Sort transfers by timestamp (most recent first)
  const sortedTransfers = transfers.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const mostRecentTransfer = sortedTransfers[0]
  if (!mostRecentTransfer) {
    throw new Error('No transfers provided for grouping')
  }

  // Use the most recent transfer's data (value, note, etc.) without modification
  const groupedActivity: Activity = {
    ...mostRecentTransfer,
    data: {
      ...mostRecentTransfer.data,
      // Add metadata to indicate this is a grouped transfer
      grouped_transfers: sortedTransfers.length,
      transfer_count: sortedTransfers.length,
    },
    // Keep the most recent transfer's timestamp
    created_at: mostRecentTransfer.created_at,
  }

  return groupedActivity
}

/**
 * Groups SendAccountTransfers from the same sender into a single activity.
 * Only groups transfers between Send accounts (both from_user and to_user have send_id).
 * Excludes withdrawals/deposits (where one send_id is null).
 * The grouped activity will show the most recent transfer's value and note.
 */
function groupSendAccountTransfers(activities: Activity[]): Activity[] {
  const grouped: Activity[] = []
  const transferGroups = new Map<string, Activity[]>()

  // Separate transfers from other activities
  for (const activity of activities) {
    if (activity.event_name === Events.SendAccountTransfers) {
      // Only group transfers between Send accounts (both have send_id)
      // Skip withdrawals/deposits (where one send_id is null)
      const isBetweenSendAccounts = activity.from_user?.send_id && activity.to_user?.send_id

      if (isBetweenSendAccounts) {
        const senderKey = activity.data.f.toLowerCase()
        if (!transferGroups.has(senderKey)) {
          transferGroups.set(senderKey, [])
        }
        const group = transferGroups.get(senderKey)
        if (group) {
          group.push(activity)
        }
      } else {
        // Don't group withdrawals/deposits - add them individually
        grouped.push(activity)
      }
    } else {
      grouped.push(activity)
    }
  }

  // Process each group of transfers
  for (const [, transferGroup] of transferGroups) {
    if (transferGroup.length === 1) {
      // Single transfer, no grouping needed
      const singleTransfer = transferGroup[0]
      if (singleTransfer) {
        grouped.push(singleTransfer)
      }
    } else {
      // Multiple transfers from same sender - create grouped activity
      const groupedActivity = createGroupedTransferActivity(transferGroup)
      grouped.push(groupedActivity)
    }
  }

  // Sort by created_at to maintain chronological order
  return grouped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * Infinite query to fetch activity feed. Filters out activities with no from or to user (not a send app user).
 * Processes activities to handle special cases like Send Earn deposits.
 *
 * @param pageSize - number of items to fetch per page
 * @param groupTransfers - whether to group SendAccountTransfers from the same sender
 */
export function useActivityFeed({
  pageSize = 10,
  groupTransfers = false,
}: { pageSize?: number; groupTransfers?: boolean } = {}): UseInfiniteQueryResult<
  InfiniteData<Activity[]>,
  PostgrestError | ZodError
> {
  const supabase = useSupabase()
  const addressBook = useAddressBook()
  const enabled = useMemo(() => addressBook.isError || addressBook.isSuccess, [addressBook])
  const queryKey = useMemo(
    () => ['activity_feed', { addressBook, pageSize, groupTransfers }] as const,
    [addressBook, pageSize, groupTransfers]
  )
  return useInfiniteQuery<
    Activity[],
    PostgrestError | ZodError,
    InfiniteData<Activity[], number>,
    typeof queryKey,
    number
  >({
    enabled,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage !== null && lastPage.length < pageSize) return undefined
      return lastPageParam + 1
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
      if (firstPageParam <= 1) {
        return undefined
      }
      return firstPageParam - 1
    },
    queryFn: async ({ queryKey: [, { addressBook, pageSize, groupTransfers }], pageParam }) => {
      throwIf(addressBook.error)
      assert(!!addressBook.data, 'Fetching address book failed')
      return await fetchActivityFeed({
        pageParam,
        supabase,
        pageSize,
        addressBook: addressBook.data,
        groupTransfers,
      })
    },
  })
}

/**
 * Fetches the activity feed for the current user.
 *
 * @param params.pageParam - The page number to fetch
 * @param params.addressBook - The address book containing known addresses and their labels
 * @param params.supabase - The Supabase client
 * @param params.pageSize - The number of items to fetch per page
 * @param params.groupTransfers - whether to group SendAccountTransfers from the same sender
 */
async function fetchActivityFeed({
  pageParam,
  supabase,
  pageSize,
  addressBook,
  groupTransfers,
}: {
  pageParam: number
  addressBook: AddressBook
  supabase: SupabaseClient<Database>
  pageSize: number
  groupTransfers: boolean
}): Promise<Activity[]> {
  const from = pageParam * pageSize
  const to = (pageParam + 1) * pageSize - 1

  const myAffiliateAddr = Object.entries(addressBook).find(
    ([, label]) => label === ContractLabels.SendEarnAffiliate
  )

  const request = supabase
    .from('activity_feed')
    .select('*')
    .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
    .or(
      getBaseAddressFilterCondition({
        extraFrom: undefined,
        // shows as Sendtag Registered using a different activity row
        extraTo: sendtagCheckoutAddresses,
      })
    )
    .or(
      [
        // exclude Send Earn deposits and withdrawals from the feed (they show up as SendAccountTransfers)
        `event_name.not.in.(${[Events.SendEarnDeposit, Events.SendEarnWithdraw].join(',')})`,
        // affiliate rewards are send earn deposits, so include them in the feed (they won't show up as SendAccountTransfers)
        myAffiliateAddr
          ? `and(${[
              `event_name.in.(${Events.SendEarnDeposit})`,
              `data->>sender.eq.${hexToBytea(myAffiliateAddr[0] as `0x${string}`)})`,
            ].join(',')})`
          : null,
      ]
        .filter(Boolean)
        .join(',')
    )
    .order('created_at', { ascending: false })
    .range(from, to)
  const { data, error } = await request
  throwIf(error)

  // Parse the raw data first
  const activities = EventArraySchema.parse(data)

  // Group transfers if requested
  if (groupTransfers) {
    return groupSendAccountTransfers(activities)
  }

  return activities
}
