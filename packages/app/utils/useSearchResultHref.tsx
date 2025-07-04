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
      case path === '/' || path.startsWith('/send'): {
        const _sendParams = JSON.parse(JSON.stringify(sendParams)) //JSON makes sure we don't pass undefined values
        return `/send${Platform.OS === 'web' ? '' : '/form'}?${new URLSearchParams({
          ..._sendParams,
          recipient: query,
          idType: 'address',
        }).toString()}`
      }

      default:
        return ''
    }
  }

  switch (true) {
    case path === '/' || path.startsWith('/send'): {
      const _sendParams = JSON.parse(JSON.stringify(sendParams)) //JSON makes sure we don't pass undefined values
      if (profile.tag_name) {
        return `/send${Platform.OS === 'web' ? '' : '/form'}?${new URLSearchParams({
          ..._sendParams,
          idType: 'tag',
          recipient: profile.tag_name,
        }).toString()}`
      }
      return `/send${Platform.OS === 'web' ? '' : '/form'}?${new URLSearchParams({
        ..._sendParams,
        idType: 'sendid',
        recipient: profile.send_id,
      }).toString()}`
    }
    default: {
      return `/profile/${profile.send_id}`
    }
  }
}
