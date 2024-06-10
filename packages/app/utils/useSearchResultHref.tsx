import { useSendScreenParams } from 'app/routers/params'
import { usePathname } from 'app/utils/usePathname'
import type { SearchResultCommonType } from 'app/components/SearchBar'

export const useSearchResultHref = (item: SearchResultCommonType) => {
  const path = usePathname()
  const [sendParams] = useSendScreenParams()

  switch (path) {
    case '/activity':
      return `/profile/${item.send_id}`
    case '/send':
      return `/send?${new URLSearchParams({
        ...JSON.parse(JSON.stringify(sendParams)), //JSON makes sure we don't pass undefined values
        recipient: item.tag_name || item.send_id,
      }).toString()}`
    default: {
      throw new Error('Unhandled path in `useSearchResultHref`')
    }
  }
}
