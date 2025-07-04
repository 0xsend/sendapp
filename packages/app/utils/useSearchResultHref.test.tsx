// packages/app/utils/useSearchResultHref.test.tsx
import { describe, it, expect, jest } from '@jest/globals'
import { useSearchResultHref } from './useSearchResultHref'
import { usePathname } from 'app/utils/usePathname.native'
import type { SearchResultCommonType } from 'app/components/SearchBar'
import type { SendScreenParams } from 'app/routers/params'
import { baseMainnet } from '@my/wagmi'
import { useRootScreenParams } from 'app/routers/params'
import { zeroAddress } from 'viem'

const sendParams: SendScreenParams = {
  idType: 'tag',
  recipient: 'alice',
  amount: '0.01',
  sendToken: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
}

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}))

jest.mock('app/routers/params', () => ({
  useSendScreenParams: jest.fn().mockReturnValue([sendParams]),
  useRootScreenParams: jest.fn().mockReturnValue([{ search: 'alice' }]),
}))

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
}))

jest.mock('app/utils/usePathname.native', () => ({
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

describe('useSearchResultHref', () => {
  it('should return the correct href for activity screen', () => {
    // @ts-expect-error mock
    usePathname.mockReturnValue('/activity')
    const href = useSearchResultHref(item)
    expect(href).toBe('/profile/12530')
  })
  it('should return basescan link for EOA for activity screen', () => {
    //@ts-expect-error mock
    useRootScreenParams.mockReturnValueOnce([{ search: zeroAddress }])
    // @ts-expect-error mock
    usePathname.mockReturnValue('/activity')
    const href = useSearchResultHref()
    expect(href).toBe(`${baseMainnet.blockExplorers.default.url}/address/${zeroAddress}`)
  })
  it('should return the correct href for send screen', () => {
    // @ts-expect-error mock
    usePathname.mockReturnValue('/send')
    const href = useSearchResultHref(item)
    expect(href).toBe(
      '/send?idType=tag&recipient=alice&amount=0.01&sendToken=0xEab49138BA2Ea6dd776220fE26b7b8E446638956'
    )
  })
  it('should return the correct href for send screen when user does not have sendtag', () => {
    // @ts-expect-error mock
    usePathname.mockReturnValue('/send')
    const href = useSearchResultHref({ ...item, tag_name: '' })
    expect(href).toBe(
      '/send?idType=sendid&recipient=12530&amount=0.01&sendToken=0xEab49138BA2Ea6dd776220fE26b7b8E446638956'
    )
  })
  it('should return profile url by default', () => {
    // @ts-expect-error mock
    usePathname.mockReturnValue('/unhandled-path')
    const href = useSearchResultHref(item)
    expect(href).toBe('/profile/12530')
  })
})
