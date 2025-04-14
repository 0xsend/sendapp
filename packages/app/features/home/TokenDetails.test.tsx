import '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { usdcCoin } from 'app/data/coins'
import { TokenDetails } from './TokenDetails'
import { act, render, screen } from '@testing-library/react-native'
import { ScrollDirectionProvider } from 'app/provider/scroll'

jest.mock('app/features/home/utils/useTokenActivityFeed')

jest.mock('app/utils/useSwapRouters', () => ({
  useSwapRouters: jest.fn().mockReturnValue({ data: [] }),
}))

jest.mock('app/utils/useLiquidityPools', () => ({
  useLiquidityPools: jest.fn().mockReturnValue({ data: [] }),
}))

jest.mock('app/utils/useTokenPrices', () => ({
  useTokenPrices: jest.fn().mockReturnValue({
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 1,
    eth: 1,
    '0xEab49138BA2Ea6dd776220fE26b7b8E446638956': 1,
  }),
}))

jest.mock('app/utils/useCoinFromTokenParam', () => ({
  useCoinFromTokenParam: jest.fn().mockReturnValue({
    coin: {
      label: 'USDC',
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      balance: 250000n,
    },
    isLoading: false,
  }),
}))

describe('TokenDetails', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-28'))
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test('renders correctly', async () => {
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ScrollDirectionProvider>
          <TokenDetails coin={{ ...usdcCoin, balance: 1n }} />
        </ScrollDirectionProvider>
      </TamaguiProvider>
    )

    // Handle initial renders and animations
    await act(async () => {
      jest.advanceTimersByTime(100) // Small initial advance
      jest.runOnlyPendingTimers()
    })

    // Handle any remaining animations
    await act(async () => {
      jest.advanceTimersByTime(1000)
      jest.runOnlyPendingTimers()
    })

    expect(screen.toJSON()).toMatchSnapshot()

    // Assertions
    expect(screen.getByText('Trade')).toBeOnTheScreen()

    // 2 deposit elements, button to deposit and deposit activity row

    const depositNodes = screen.getAllByText('Deposit')
    expect(depositNodes.length).toBe(2)
    for (const node of depositNodes) {
      expect(node).toBeOnTheScreen()
    }

    expect(screen.getByText('Withdraw')).toBeOnTheScreen()
    expect(screen.getByText('Received')).toBeOnTheScreen()
    expect(screen.getByText('/alice')).toBeOnTheScreen()
    expect(screen.getByText('0xa71...0000')).toBeOnTheScreen()
    expect(screen.getByText('0x93F...761a')).toBeOnTheScreen()
    expect(screen.getByText('10 USDC')).toBeOnTheScreen()
    expect(screen.getByText('20 USDC')).toBeOnTheScreen()
    expect(screen.getByText('30 USDC')).toBeOnTheScreen()
  })
})
