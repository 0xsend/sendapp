import { expect, describe, beforeEach, afterEach, it, jest } from '@jest/globals'
import { TamaguiProvider, View as MockView, config } from '@my/ui'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { ActivityScreen } from './screen'
import { useSearchResultHref } from 'app/utils/useSearchResultHref'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useRootScreenParams } from 'app/routers/params'
import { ScrollDirectionProvider } from 'app/provider/scroll'

jest.unmock('app/provider/tag-search')
jest.mock('app/utils/useSearchResultHref')
jest.mock('app/features/activity/utils/useActivityFeed')
jest.mock('app/routers/params')
jest.mock('app/utils/supabase/useSupabase')

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
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
        token: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
        balance: 250000n,
      },
    ],
    totalPrice: 5000000n,
  }),
}))

jest.mock('app/utils/useSwapRouters', () => ({
  useSwapRouters: jest.fn().mockReturnValue({ data: [] }),
}))

jest.mock('app/utils/useLiquidityPools', () => ({
  useLiquidityPools: jest.fn().mockReturnValue({ data: [] }),
}))

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-19T12:00:00Z'))
    // @ts-expect-error mock
    useSearchResultHref.mockImplementation((item) => {
      return `/profile/${item.send_id}`
    })
  })

  afterEach(async () => jest.useRealTimers())

  it('renders activity screen', async () => {
    ;(useSupabase as jest.Mock).mockReturnValue({
      rpc: jest.fn().mockReturnValue({
        abortSignal: jest.fn().mockReturnValue({
          data: [
            {
              send_id_matches: [],
              tag_matches: [],
              phone_matches: [],
              address_matches: [],
            },
          ],
          error: null,
        }),
      }),
    })
    ;(useRootScreenParams as jest.Mock).mockReturnValue([{}, jest.fn()])

    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ScrollDirectionProvider>
          <ActivityScreen />
        </ScrollDirectionProvider>
      </TamaguiProvider>
    )
    await act(async () => {
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })

    expect(screen.getByTestId('RecentActivity')).toBeOnTheScreen()
    expect(screen.getByText('Deposit')).toBeOnTheScreen()
    for (const node of screen.getAllByText('Sendtag Registered')) {
      expect(node).toBeOnTheScreen()
    }
    expect(screen.getByText('Referral')).toBeOnTheScreen()
    expect(screen.getByText('Send Account Signing Key Added')).toBeOnTheScreen()
    expect(screen.getByText('Send Account Signing Key Removed')).toBeOnTheScreen()
    expect(screen.getByText('Send Token Upgrade')).toBeOnTheScreen()
    expect(screen).toMatchSnapshot()
  })

  it('returns the correct search results', async () => {
    ;(useSupabase as jest.Mock).mockReturnValue({
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
    })
    ;(useRootScreenParams as jest.Mock).mockReturnValue([{ search: 'test' }, jest.fn()])

    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ScrollDirectionProvider>
          <ActivityScreen />
        </ScrollDirectionProvider>
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
