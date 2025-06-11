import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'
import { usePathname } from 'app/utils/usePathname'
import type { SearchResultCommonType } from 'app/components/SearchBar'
import { isAddress } from 'viem'
import { baseMainnet } from '@my/wagmi'
import { Platform } from 'react-native'

export const useSearchResultHref = (profile?: SearchResultCommonType) => {
  const [queryParams] = useRootScreenParams()
  const { search: query } = queryParams
  const path = usePathname()
  const [sendParams] = useSendScreenParams()
  if (!profile) {
    switch (true) {
      case !query || !isAddress(query):
        return ''
      case path === '/activity':
        return `${baseMainnet.blockExplorers.default.url}/address/${query}`
      case path === '/send' || path === '/': {
        const _sendParams = JSON.parse(JSON.stringify(sendParams)) //JSON makes sure we don't pass undefined values
        return `/send?${new URLSearchParams({
          ..._sendParams,
          recipient: query,
          idType: 'address',
        }).toString()}`
      }

      default:
        throw new Error(`Unhandled path: ${path}`)
    }
  }

  switch (true) {
    // Page-based routing means when you navigate from `/activity` to `/profile/:send_id`, the entire ActivityScreen component unmounts, so the hook doesn't re-execute
    // Stack-based navigation keeps the previous screen mounted in memory, causing the hook to re-execute with the new pathname
    case path === '/activity' || (Platform.OS !== 'web' && path.startsWith('/profile/')):
      return `/profile/${profile.send_id}`
    case path === '/send' || path === '/': {
      const _sendParams = JSON.parse(JSON.stringify(sendParams)) //JSON makes sure we don't pass undefined values
      if (profile.tag_name) {
        return `/send?${new URLSearchParams({
          ..._sendParams,
          idType: 'tag',
          recipient: profile.tag_name,
        }).toString()}`
      }
      return `/send?${new URLSearchParams({
        ..._sendParams,
        idType: 'sendid',
        recipient: profile.send_id,
      }).toString()}`
    }
    default: {
      throw new Error(`Unhandled path: ${path}`)
    }
  }
}
