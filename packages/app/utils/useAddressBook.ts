import { useSendEarnBalances } from 'app/features/earn/hooks'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { throwIf } from './throwIf'
import SuperJSON from 'superjson'
import { address } from './zod'
import { z } from 'zod'

const AddressBookSchema = z.record(address, z.string())
export type AddressBook = z.infer<typeof AddressBookSchema>

/**
 * A hook to build a contacts list for the Send Account. There are probably better ways to do this and lots of room for improvement.
 *
 * Potentially there is a solution that can be solved by joining a computed table with the activity feed view.
 */
export function useAddressBook() {
  const queries = [useSendEarnBalances()] as const
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
      return {
        ...Object.fromEntries(queries[0].data?.map((b) => [b.log_addr, 'Send Earn']) || []),
      }
    },
  })
}
