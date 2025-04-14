import { config, TamaguiProvider } from '@my/ui'
import { act, render, screen } from '@testing-library/react-native'
import { ActivityScreen } from './screen'
import { useSearchResultHref } from 'app/utils/useSearchResultHref'

jest.unmock('app/provider/tag-search')
jest.mock('app/utils/useSearchResultHref')

jest.mock('app/features/activity/utils/useActivityFeed')

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
  })

  afterEach(() => jest.useRealTimers())

  it('renders activity screen', async () => {
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityScreen />
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
})
