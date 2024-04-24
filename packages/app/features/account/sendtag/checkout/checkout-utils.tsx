import type { Tables } from '@my/supabase/database.types'
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { parseEther } from 'viem'

export const verifyAddressMsg = (a: string | `0x${string}`) =>
  `I am the owner of the address: ${a}.

Send.it`

//@todo: should probaby fetch this from db
export const maxNumSendTags = 5

export function getPriceInWei(pendingTags: { name: string }[]) {
  return pendingTags.reduce((acc, { name }) => {
    const total = acc + tagLengthToWei(name.length)

    return total
  }, BigInt(0))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tagLengthToWei(length: number) {
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
