import type { Database } from '@my/supabase/database.types'
import { baseMainnet } from '@my/wagmi'
import { useProfileLookup } from 'app/utils/useProfileLookup'

export const useProfileHref = (
  lookup_type: Database['public']['Enums']['lookup_type_enum'],
  identifier: string
) => {
  // refcode and phone cannot be linked directly to. This will disable the query when its not needed
  const isEnabled = ['refcode', 'phone'].includes(lookup_type)
  const { data: profile, error } = useProfileLookup(lookup_type, identifier ?? '')
  switch (lookup_type) {
    case 'address':
      return `${baseMainnet.blockExplorers.default.url}/address/${identifier}`
    case 'tag':
      return `/${identifier}`
    case 'sendid':
      return `/profile/${identifier}`
    default:
      if (error) return '/'
      if (!profile) return '/'
      return `/profile/${profile.sendid}`
  }
}
