import { act, render, screen } from '@testing-library/react-native'
import { config, TamaguiProvider } from '@my/ui'
import { SwapFormScreen } from 'app/features/swap/form/screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

jest.mock('app/features/swap/hooks/useDidUserSwap', () => ({
  useDidUserSwap: jest.fn().mockReturnValue({
    data: false,
  }),
}))

jest.mock('app/provider/coins', () => ({
  useCoins: jest.fn().mockReturnValue({
    allCoins: [
      {
        label: 'USDC',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        balance: 250000n,
        decimals: 6,
      },
      {
        label: 'SEND',
        token: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
        balance: 250000n,
        decimals: 18,
      },
    ],
    totalPrice: 5000000n,
  }),
  useCoin: jest.fn().mockReturnValue({
    coin: {
      label: 'USDC',
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      balance: 2500000n,
      decimals: 6,
    },
    isLoading: false,
  }),
}))

jest.mock('app/utils/api', () => ({
  api: {
    swap: {
      fetchSwapRoute: {
        useQuery: jest.fn().mockReturnValue({
          data: {
            routeSummary: {
              amountInUsd: '1.00',
              amountOutUsd: '0.99',
              amountOut: '120',
            },
          },
          error: null,
          isFetching: false,
        }),
      },
    },
  },
}))

jest.mock('app/routers/params', () => ({
  useSwapScreenParams: jest.fn().mockReturnValue([
    {
      outToken: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
      inToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      inAmount: '1000000',
      slippage: '50',
    },
    jest.fn(),
  ]),
}))

jest.mock('solito/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}))

describe('swap form screen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-19T12:00:00Z'))
  })

  it('should render', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider defaultTheme={'dark'} config={config}>
          <SwapFormScreen />
        </TamaguiProvider>
      </QueryClientProvider>
    )

    await act(async () => {
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })

    expect(screen.toJSON()).toMatchSnapshot()

    expect(screen.getByText('You Pay')).toBeOnTheScreen()
    expect(screen.getByText('$1')).toBeOnTheScreen()

    expect(screen.getByText('max')).toBeOnTheScreen()

    expect(screen.getByText('You Receive')).toBeOnTheScreen()
    expect(screen.getByText('$0.99')).toBeOnTheScreen()

    expect(screen.getByText('Max Slippage')).toBeOnTheScreen()
    expect(screen.getByText('0.5%')).toBeOnTheScreen()

    expect(screen.getByText('review')).toBeOnTheScreen()
  })
})
