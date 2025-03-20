import {
  sendEarnAddress,
  sendEarnUsdcFactoryAddress,
  sendtagCheckoutAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { useQuery } from '@tanstack/react-query'
import { useSendEarnBalances } from 'app/features/earn/hooks'
import { useMemo } from 'react'
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
const AddressBookSchema = z.record(address, z.string().or(z.nativeEnum(ContractLabels)))
export type AddressBook = z.infer<typeof AddressBookSchema>

/**
 * A hook to build a contacts list for the Send Account. There are probably better ways to do this and lots of room for improvement.
 *
 * Potentially there is a solution that can be solved by joining a computed table with the activity feed view.
 */
export function useAddressBook() {
  const queries = [
    useSendEarnBalances(),
    // add more queries here
  ] as const
  const errors = useMemo(() => queries.map((q) => q.error), [queries])
  const enabled = useMemo(() => queries.every((q) => q.isSuccess || q.isError), [queries])
  const queryKey = ['addressBook', { queries, errors }] as const
  return useQuery({
    queryKey,
    queryKeyHashFn: (queryKey) => SuperJSON.stringify(queryKey),
    enabled,
    queryFn: async ({ queryKey: [, { queries, errors }] }): Promise<AddressBook> => {
      for (const error of errors) {
        throwIf(error)
      }
      return AddressBookSchema.parse({
        ...Object.fromEntries([
          ...(queries[0].data?.map((b) => [b.log_addr, ContractLabels.SendEarn]) || []),
          // add more entries here
          ...Object.values(sendEarnAddress).map((p) => [p, ContractLabels.SendEarn]),
          ...Object.values(sendEarnUsdcFactoryAddress).map((p) => [p, ContractLabels.SendEarn]),
          ...Object.values(tokenPaymasterAddress).map((p) => [p, ContractLabels.Paymaster]),
          ...Object.values(sendtagCheckoutAddress).map((p) => [p, ContractLabels.SendtagCheckout]),
        ]),
      })
    },
  })
}
