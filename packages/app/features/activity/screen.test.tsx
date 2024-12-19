import { expect } from '@jest/globals'
import { TamaguiProvider, View as MockView, config } from '@my/ui'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { ActivityScreen } from './screen'
import { useSearchResultHref } from 'app/utils/useSearchResultHref'
jest.unmock('app/provider/tag-search')
jest.mock('app/utils/useSearchResultHref')

jest.mock('app/features/activity/utils/useActivityFeed')

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
}))

jest.mock('app/routers/params', () => ({
  useRootScreenParams: jest.fn().mockReturnValue([{ search: 'test' }, jest.fn()]),
}))

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
            address_matches: [],
          },
        ],
        error: null,
      }),
    }),
  }),
}))

jest.mock('solito/link', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <MockView dataSet={{ href }}>{children}</MockView>
  ),
  useLink: jest.fn().mockReturnValue({ href: '/profile/123', onPress: jest.fn() }),
}))

jest.mock('app/provider/coins', () => ({
  useCoins: jest.fn().mockReturnValue({
    coins: [
      {
        label: 'USDC',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        balance: 250000n,
      },
      {
        label: 'SEND',
        token: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
        balance: 250000n,
      },
    ],
    totalPrice: 5000000n,
  }),
}))

describe('ActivityScreen', () => {
  beforeEach(() => {
    // @ts-expect-error mock
    useSearchResultHref.mockImplementation((item) => {
      return `/profile/${item.send_id}`
    })
  })

  it('renders activity screen', async () => {
    jest.useFakeTimers()
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityScreen />
      </TamaguiProvider>
    )
    await act(async () => {
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })
    expect(screen.toJSON()).toMatchSnapshot('ActivityScreen')
  })

  it('returns the correct search results', async () => {
    jest.useFakeTimers()
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityScreen />
      </TamaguiProvider>
    )
    const searchInput = screen.getByPlaceholderText('Search')
    fireEvent.changeText(searchInput, 'test')
    await act(async () => {
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })
    await waitFor(() => screen.findByTestId('tag-search-3665'))

    expect(searchInput.props.value).toBe('test')
    const searchResults = await screen.findByTestId('tag-search-3665')
    expect(searchResults).toHaveTextContent('??test/test')
  })
})
