import type { Database } from '@my/supabase/database.types'
import { baseMainnet } from '@my/wagmi'

export const useProfileHref = (
  lookup_type: Database['public']['Enums']['lookup_type_enum'],
  identifier: string
) => {
  switch (true) {
    case lookup_type === 'tag':
      return `/${identifier}`
    case lookup_type === 'sendid':
      return `/profile/${identifier}`
    case lookup_type === 'address':
      return `${baseMainnet.blockExplorers.default.url}/address/${identifier}`
    default: //todo: We should hakdle phone and refcode. Preferrably at the type layer
      return ''
  }
}
