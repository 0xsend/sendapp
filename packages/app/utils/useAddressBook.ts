import {
  sendEarnAddress,
  sendEarnUsdcFactoryAddress,
  sendtagCheckoutAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { useQuery } from '@tanstack/react-query'
import { useSendEarnBalances } from 'app/features/earn/hooks'
import { useCallback, useMemo } from 'react'
import SuperJSON from 'superjson'
import { z } from 'zod'
import { throwIf } from './throwIf'
import { address } from './zod'

/**
 * Constants for contract labels used in the address book.
 * Using these constants ensures consistency across the codebase.
 */
export enum ContractLabels {
  SendEarn = 'Send Earn',
  Paymaster = 'Paymaster',
  SendtagCheckout = 'Sendtags',
}

const AddressBookSchema = z.record(address, z.string())
export type AddressBook = z.infer<typeof AddressBookSchema>

/**
 * Queries to build a dynamic address book for a Send Account. Ideally, we would offload
 * this to a database completely, but that presents a lot of challenges with respects to race conditions.
 * There's no guarantee that all event logs are indexed in the correct order on the backend, so we need to
 * handle this on the client for now.
 *
 * This is useful for screens that have mutations and want to update the address book, but it's not ideal
 */
export function useAddressBookDepQueries() {
  const queries = [
    useSendEarnBalances(),
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
  const data = useMemo(() => queries.map((q) => q.data), [queries])
  const errors = useMemo(() => queries.map((q) => q.error), [queries])
  const enabled = useMemo(() => queries.every((q) => q.isSuccess || q.isError), [queries])
  const queryKey = ['addressBook', { data, errors } as const] as const
  const queryFn = useCallback(async (): Promise<AddressBook> => {
    for (const error of errors) {
      throwIf(error)
    }
    return AddressBookSchema.parse({
      ...Object.fromEntries([
        ...(data[0]?.map((b) => [b.log_addr, ContractLabels.SendEarn]) || []),
        // add more entries here
        ...Object.values(sendEarnAddress).map((p) => [p, ContractLabels.SendEarn]),
        ...Object.values(sendEarnUsdcFactoryAddress).map((p) => [p, ContractLabels.SendEarn]),
        ...Object.values(tokenPaymasterAddress).map((p) => [p, ContractLabels.Paymaster]),
        ...Object.values(sendtagCheckoutAddress).map((p) => [p, ContractLabels.SendtagCheckout]),
      ]),
    })
  }, [data, errors])
  const query = useQuery({
    queryKey,
    queryKeyHashFn: (queryKey) => SuperJSON.stringify(queryKey),
    enabled,
    queryFn,
    staleTime: Number.POSITIVE_INFINITY, // prevent infinite render loops, invalidate when needed
  })
  return query
}
