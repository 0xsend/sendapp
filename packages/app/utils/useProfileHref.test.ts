// packages/app/utils/useSearchResultHref.test.tsx
import '@jest/globals'
import { useProfileHref } from './useProfileHref'
import type { SearchResultCommonType } from 'app/components/SearchBar'
import { baseMainnet } from '@my/wagmi'
import { zeroAddress } from 'viem'

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
}))

const item = {
  // avatar_url: string;
  avatar_url: 'https://i.pravatar.cc/500?u=alice',
  // tag_name: string;
  tag_name: 'alice',
  // send_id: number;
  send_id: 12530,
  // phone: string;
  phone: '+1234567890',
} as SearchResultCommonType

describe('useProfileHref', () => {
  it('should return the correct href for tag screen', () => {
    const href = useProfileHref('tag', item.tag_name)
    expect(href).toBe('/alice')
  })
  it('should return the correct href for sendid screen', () => {
    const href = useProfileHref('sendid', item.send_id.toString())
    expect(href).toBe(`/profile/${item.send_id}`)
  })
  it('shold return basescan link for EOA', () => {
    const href = useProfileHref('address', zeroAddress)
    expect(href).toBe(`${baseMainnet.blockExplorers.default.url}/address/${zeroAddress}`)
  })
  it('should return empty string if phone is used', () => {
    const href = useProfileHref('phone', item.phone)
    expect(href).toBe('')
  })
  it('should return empty string if refcode is used', () => {
    const href = useProfileHref('refcode', '00000')
    expect(href).toBe('')
  })
})
