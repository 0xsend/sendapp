import { useSendScreenParams } from 'app/routers/params'
import { usePathname } from 'app/utils/usePathname'
import type { SearchResultCommonType } from 'app/components/SearchBar'

export const useSearchResultHref = (profile: SearchResultCommonType) => {
  const path = usePathname()
  const [sendParams] = useSendScreenParams()

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
      throw new Error('Unhandled path in `useSearchResultHref`')
    }
  }
}
