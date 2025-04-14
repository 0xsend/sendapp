import {
  sendEarnAddress,
  sendEarnUsdcFactoryAddress,
  sendtagCheckoutAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { useQuery } from '@tanstack/react-query'
import { ContractLabels } from 'app/data/contract-labels'
import { useMyAffiliateVault, useSendEarnBalances } from 'app/features/earn/hooks'
import { useCallback, useMemo } from 'react'
import SuperJSON from 'superjson'
import { z } from 'zod'
import { throwIf } from './throwIf'
import { address } from './zod'

const AddressBookSchema = z.record(address, z.string())
export type AddressBook = z.infer<typeof AddressBookSchema>

/**
 * Queries to build a dynamic address book for a Send Account. Ideally, we would offload
 * this to a database completely, but that presents a lot of challenges with respects to race conditions.
 * There's no guarantee that all event logs are indexed in the correct order on the backend, so we need to
 * handle this on the client for now.
 *
 * This is useful for screens that have mutations and want to update the address book, but it's not ideal
 *
 * ```ts
 * const queries = useAddressBookDepQueries()
 * const queryClient = useQueryClient()
 * queryClient.invalidateQueries({ queryKey: [queries[0].queryKey] })
 * queryClient.invalidateQueries({ queryKey: [queries[1].queryKey] })
 * ```
 */
export function useAddressBookDepQueries() {
  const queries = [
    useSendEarnBalances(),
    useMyAffiliateVault(),
    // add more queries here
  ] as const
  return queries
}

/**
 * A hook to build a contacts list for the Send Account. There are probably better ways to do this and lots of room for improvement.
 *
 * Potentially there is a solution that can be solved by joining a computed table with the activity feed view.
 *
 * For now, we use a query that resolves to an address book.
 *
 * The stale time is set to Infinity to prevent the address book from causing infinite render loops. If you need
 * to update the address book, invalidate
 */
export function useAddressBook() {
  const queries = useAddressBookDepQueries()
  const data = useMemo(() => [queries[0].data, queries[1].data] as const, [queries])
  const errors = useMemo(() => queries.map((q) => q.error), [queries])
  const enabled = useMemo(() => queries.every((q) => q.isFetched), [queries])
  const queryKey = ['addressBook', { data, errors } as const] as const

  const queryFn = useCallback(async (): Promise<AddressBook> => {
    for (const error of errors) {
      throwIf(error)
    }
    const input = {
      ...Object.fromEntries([
        ...(data[0]?.map((b) => [b.log_addr, ContractLabels.SendEarn]) || []),
        ...(data[1] ? [[data[1].send_earn_affiliate, ContractLabels.SendEarnAffiliate]] : []),
        // add more entries here
        ...Object.values(sendEarnAddress).map((p) => [p, ContractLabels.SendEarn]),
        ...Object.values(sendEarnUsdcFactoryAddress).map((p) => [p, ContractLabels.SendEarn]),
        ...Object.values(tokenPaymasterAddress).map((p) => [p, ContractLabels.Paymaster]),
        ...Object.values(sendtagCheckoutAddress).map((p) => [p, ContractLabels.SendtagCheckout]),
      ]),
    }
    const addressBook = AddressBookSchema.parse(input)
    return addressBook
  }, [data, errors])
  const query = useQuery({
    queryKey,
    queryKeyHashFn: (queryKey) => SuperJSON.stringify(queryKey),
    enabled,
    queryFn,
    staleTime: 30_000, // prevent infinite render loops, invalidate when needed
  })
  return query
}
