import type { Tables } from '@my/supabase/database.types'
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { parseEther } from 'viem'

export const verifyAddressMsg = (a: string | `0x${string}`) =>
  `I am the owner of the address: ${a}.

Send.it`

//@todo: should probaby fetch this from db
export const maxNumSendTags = 5

/**
 * Returns the total price of all pending Sendtags.
 * @param pendingTags The pending Sendtags.
 * @returns The total price of all pending Sendtags.
 */
export function getPrice(pendingTags: { name: string }[]) {
  return pendingTags.reduce((acc, { name }) => {
    const total = acc + tagLengthPrice(name.length)

    return total
  }, BigInt(0))
}

/**
 * Returns the price of a Sendtag of the given length.
 * @param length The length of the Sendtag.
 * @returns The price of the Sendtag.
 */
export function tagLengthPrice(length: number) {
  switch (length) {
    case 5:
      return parseEther('0.005')
    case 4:
      return parseEther('0.01')
    case 3:
    case 2:
    case 1:
      return parseEther('0.02')
    default:
      return parseEther('0.002')
  }
}

export function useSenderSafeReceivedEvents() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['senderSafeReceivedEvents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('send_revenues_safe_receives').select('*')
      if (error) {
        throw error
      }
      return data
    },
    refetchInterval: 1000 * 5, // 5 seconds
  })
}
export const hasFreeTag = (tagName: string, confirmedTags: Tables<'tags'>[]) => {
  // could be free if tag name is greater than 6 characters
  const hasFreeTag = tagName.length >= 6

  // check if there are any confirmed tags that are 6 characters or longer
  return (
    hasFreeTag && (confirmedTags?.length === 0 || confirmedTags.every((tag) => tag.name.length < 6))
  )
}
