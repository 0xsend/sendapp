import type { Database } from '@my/supabase/database.types'
import {
  sendEarnAddress,
  sendEarnUsdcFactoryAddress,
  sendtagCheckoutAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useQueries } from '@tanstack/react-query'
import { ContractLabels } from 'app/data/contract-labels'
import { myAffiliateVaultQueryOptions, sendEarnBalancesQueryOptions } from 'app/features/earn/hooks'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import SuperJSON from 'superjson'
import { z } from 'zod'
import { useSendAccount } from './send-accounts'
import { address } from './zod'

const AddressBookSchema = z.record(address, z.string())
export type AddressBook = z.infer<typeof AddressBookSchema>

/**
 * Query options to build a dynamic address book for a Send Account.
 *
 * This returns the query options for the dependent queries that are used to build the address book.
 * It is useful for screens that have mutations and want to update the address book.
 */
export function useAddressBookDepQueries({
  supabase,
  sendAccount,
}: {
  supabase: SupabaseClient<Database>
  sendAccount: ReturnType<typeof useSendAccount>
}) {
  const queryOptions = [
    sendEarnBalancesQueryOptions(supabase),
    myAffiliateVaultQueryOptions({ supabase, sendAccount }),
    // add more queries here
  ] as const
  return queryOptions
}

/**
 * A hook to build a contacts list for the Send Account using useQueries.
 *
 * Potentially there is a solution that can be solved by joining a computed table with the activity feed view.
 *
 * For now, we use useQueries that combines the results into an address book.
 *
 * The stale time is set to Infinity to prevent the address book from causing infinite render loops. If you need
 * to update the address book, invalidate the dependent queries.
 */
export function useAddressBook() {
  const supabase = useSupabase()
  const sendAccount = useSendAccount()
  const queryOptions = useAddressBookDepQueries({
    supabase,
    sendAccount,
  })

  const result = useQueries({
    queries: queryOptions,
    combine: (results) => {
      // Extract the data from each query result
      const [balancesResult, affiliateVaultResult] = results
      const data = [balancesResult.data, affiliateVaultResult.data] as const
      const errors = results.map((q) => q.error)
      const enabled = results.every((q) => q.isSuccess || q.isError)

      // Create a query key data object similar to the original implementation
      const queryKeyData = {
        balanceIds: data[0]?.map((b) => b.log_addr),
        affiliateVaultId: data[1]?.send_earn_affiliate,
        errors,
      }

      // Only proceed if all queries have completed (success or error)
      if (!enabled) {
        return {
          data: undefined,
          isLoading: false,
          isSuccess: false,
          isError: false,
          error: undefined,
        }
      }

      // Check for errors
      const error = errors.find((e) => e !== null && e !== undefined)
      if (error) {
        return {
          data: undefined,
          isLoading: false,
          isSuccess: false,
          isError: true,
          error,
        }
      }

      // Generate the address book data
      try {
        const addressBookData = AddressBookSchema.parse({
          ...Object.fromEntries([
            ...(data[0]?.map((b) => [b.log_addr, ContractLabels.SendEarn]) || []),
            ...(data[1]?.send_earn_affiliate
              ? ([[data[1].send_earn_affiliate, ContractLabels.SendEarnAffiliate]] as const)
              : []),
            // add more entries here
            ...Object.values(sendEarnAddress).map((p) => [p, ContractLabels.SendEarn]),
            ...Object.values(sendEarnUsdcFactoryAddress).map((p) => [p, ContractLabels.SendEarn]),
            ...Object.values(tokenPaymasterAddress).map((p) => [p, ContractLabels.Paymaster]),
            ...Object.values(sendtagCheckoutAddress).map((p) => [
              p,
              ContractLabels.SendtagCheckout,
            ]),
          ]),
        })

        return {
          data: addressBookData,
          isSuccess: true,
          isError: false,
          error: undefined,
          // Include additional properties similar to useQuery result
          queryKey: ['addressBook', queryKeyData] as const,
          queryKeyHashFn: (queryKey: unknown) => SuperJSON.stringify(queryKey),
        }
      } catch (err) {
        return {
          data: undefined,
          isSuccess: false,
          isError: true,
          error: err instanceof Error ? err : new Error(String(err)),
        }
      }
    },
  })
  return result
}
