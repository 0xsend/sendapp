import { act, render, screen } from '@testing-library/react-native'
import { config, TamaguiProvider } from '@my/ui'
import { SwapSummaryScreen } from 'app/features/swap/summary/screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SWAP_ROUTE_SUMMARY_QUERY_KEY } from 'app/features/swap/constants'

const queryClient = new QueryClient()

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
  useCoin: jest
    .fn()
    .mockReturnValueOnce({
      coin: {
        symbol: 'SEND',
        token: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
        balance: 2500000n,
        decimals: 18,
      },
      isLoading: false,
    })
    .mockReturnValue({
      coin: {
        symbol: 'USDC',
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
      encodeSwapRoute: {
        useMutation: jest.fn().mockReturnValue({
          useMutation: jest.fn(),
          data: {},
          error: null,
          isPending: false,
          status: 'idle',
        }),
      },
    },
  },
}))

jest.mock('app/utils/useSwapRouters', () => ({
  useSwapRouters: jest.fn(),
}))

jest.mock('app/utils/useLiquidityPools', () => ({
  useLiquidityPools: jest.fn(),
}))

jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: jest.fn().mockReturnValue({
    data: {
      send_account_credentials: [],
    },
    isLoading: false,
  }),
}))

jest.mock('app/routers/params', () => ({
  useSwapScreenParams: jest.fn().mockReturnValue([
    {
      inToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      outToken: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
      inAmount: '1000000',
      slippage: '50',
    },
    jest.fn(),
  ]),
}))

jest.mock('app/utils/useCoinFromTokenParam', () => ({
  useCoinFromSendTokenParam: jest.fn().mockReturnValue({ tokensQuery: {}, ethQuery: {} }),
}))

jest.mock('app/features/swap/hooks/useSwap', () => ({
  useSwap: jest.fn().mockReturnValue({
    userOp: {},
    userOpError: null,
    isLoadingUserOp: false,
    usdcFees: { baseFee: 100000n, gasFees: 100000n },
    usdcFeesError: null,
    isLoadingUSDCFees: false,
  }),
}))

jest.mock('solito/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}))

describe('swap summary screen', () => {
  queryClient.setQueryData([SWAP_ROUTE_SUMMARY_QUERY_KEY], {
    amountIn: '10000000000',
    amountOut: '5000000000000000000000',
  })

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-19T12:00:00Z'))
  })

  it('should render', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider defaultTheme={'dark'} config={config}>
          <SwapSummaryScreen />
        </TamaguiProvider>
      </QueryClientProvider>
    )

    await act(async () => {
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })

    expect(screen.toJSON()).toMatchSnapshot()

    expect(screen.getByTestId('swapInAmount')).toHaveTextContent('10,000')
    expect(screen.getByTestId('swapOutAmount')).toHaveTextContent('5,000')

    expect(screen.getByText('Exchange Rate')).toBeOnTheScreen()
    expect(screen.getByText('1 USDC = 0.5 SEND')).toBeOnTheScreen()

    expect(screen.getByText('Transaction Fee')).toBeOnTheScreen()
    expect(screen.getByText('0.20 USDC')).toBeOnTheScreen()

    expect(screen.getByText('Send Fee')).toBeOnTheScreen()
    expect(screen.getByText('0.75%')).toBeOnTheScreen()

    expect(screen.getByText('Max Slippage')).toBeOnTheScreen()
    expect(screen.getByText('0.5%')).toBeOnTheScreen()

    expect(screen.getByText('confirm trade')).toBeOnTheScreen()
  })
})
