import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'
import { usePathname } from 'app/utils/usePathname'
import type { SearchResultCommonType } from 'app/components/SearchBar'
import { isAddress } from 'viem'
import { baseMainnet } from '@my/wagmi'

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
      case path === '/send':
        return `/send?recipient=${query}&idType=address`
      default: {
        throw new Error(`Unhandled path: ${path}`)
      }
    }
  }

  switch (path) {
    case '/activity':
      return `/profile/${profile.send_id}`
    case '/send': {
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
