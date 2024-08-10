import * as params from 'app/routers/params'
import { expect } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render, act, screen, userEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './screen'
import { TagSearchProvider } from 'app/provider/tag-search'

jest.mock('@my/wagmi')

jest.mock('app/routers/params', () => ({
  useNav: jest.fn().mockReturnValue([undefined, jest.fn()]),
}))

jest.mock('solito', () => {
  // console.log('mock solito')
  const mockCreateParam = jest.fn(() => {
    // console.log('createParam in')
    return {
      useParam: jest.fn(() => {
        // console.log('useParam', name, opts)
        return ['test', jest.fn()]
      }),
      useParams: jest.fn(() => {
        // console.log('useParams', name, opts)
        return ['test', jest.fn()]
      }),
    }
  })
  return {
    __esModule: true,
    createParam: mockCreateParam,
  }
})

jest.mock('app/utils/useUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue(123),
}))

jest.mock('app/utils/useSendAccountBalances', () => ({
  useSendAccountBalances: jest.fn().mockReturnValue({
    balances: {
      usdc: { result: 500000n },
      send: { result: 500000n },
    },
    totalBalance: () => 1000000n,
  }),
}))
jest.mock('@tamagui/tooltip', () => ({
  ...jest.requireActual('@tamagui/tooltip'),
  TooltipGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('solito', () => ({
  createParam: jest
    .fn()
    .mockReturnValue({ useParam: jest.fn().mockReturnValue([undefined, jest.fn()]) }),
}))

jest.mock('app/routers/params', () => ({
  useSendScreenParams: jest
    .fn()
    .mockReturnValue([
      { idType: 'tag', recipient: 'test', amount: 'test', sendToken: 'test', note: 'test' },
      jest.fn(),
    ]),
  useRootScreenParams: jest
    .fn()
    .mockReturnValue([{ nav: 'home', token: undefined, search: 'test' }, jest.fn()]),
}))

jest.mock('app/features/home/utils/useTokenActivityFeed')

jest.mock('app/utils/supabase/useSupabase', () => ({
  useSupabase: jest.fn().mockReturnValue({
    rpc: jest.fn().mockReturnValue({
      abortSignal: jest.fn().mockReturnValue({
        data: [
          {
            send_id_matches: [],
            tag_matches: [
              {
                send_id: 3665,
                tag_name: 'test',
                avatar_url: 'https://avatars.githubusercontent.com/u/123',
              },
            ],
            phone_matches: [],
          },
        ],
        error: null,
      }),
    }),
  }),
}))

jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: jest.fn().mockReturnValue({
    data: {
      avatar_url: 'https://avatars.githubusercontent.com/u/123',
      name: 'test',
      about: 'test',
      refcode: 'test',
      tag: 'test',
      address: '0x123',
      phone: 'test',
      chain_id: 1,
      is_public: true,
      sendid: 1,
      all_tags: ['test'],
    },
  }),
}))

import { usePathname } from 'expo-router'
// @ts-expect-error mock
usePathname.mockReturnValue('/')
describe('HomeScreen', () => {
  it('should render with search when on / and a sendable account exists', async () => {
    jest.useFakeTimers()

    const tree = render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <TagSearchProvider>
          <HomeScreen />
        </TagSearchProvider>
      </TamaguiProvider>
    ).toJSON()

    act(() => {
      jest.runAllTimers()
    })

    expect(tree).toMatchSnapshot('render')

    expect(params.useRootScreenParams).toHaveBeenCalled()

    const searchBy = await screen.findByRole('search', { name: 'query' })
    const user = userEvent.setup()

    await act(async () => {
      await user.type(searchBy, 'test')
      jest.advanceTimersByTime(3000)
      jest.runAllTimers()
    })
    await waitFor(() => screen.findByTestId('searchResults'))
    expect(screen.toJSON()).toMatchSnapshot('search')
    expect(screen.getByTestId('tag-search-3665')).toHaveTextContent('??test/test')
    const avatar = screen.getByTestId('avatar')
    expect(avatar).toBeOnTheScreen()
    expect(avatar.props.source.uri).toBe('https://avatars.githubusercontent.com/u/123')
    const link = screen.getByTestId('MockSolitoLink')
    expect(link).toBeOnTheScreen()
    expect(link.props.href).toBe(
      '/send?idType=tag&recipient=test&amount=test&sendToken=test&note=test'
    )
  })
})
