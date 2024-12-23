import { TamaguiProvider, config } from '@my/ui'
import { render, act, screen } from '@testing-library/react-native'
import { HomeScreen } from './screen'

jest.mock('@my/wagmi')

jest.mock('app/routers/params', () => ({
  useNav: jest.fn().mockReturnValue([undefined, jest.fn()]),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockReturnValue(Promise.resolve(null)),
  setItem: jest.fn().mockReturnValue(Promise.resolve()),
}))

jest.mock('react-use-precision-timer', () => ({
  useStopwatch: jest.fn().mockReturnValue({
    isRunning: jest.fn().mockReturnValue(false),
    start: jest.fn(),
    pause: jest.fn(),
    getElapsedRunningTime: jest.fn().mockReturnValue(0),
  }),
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
  useUserReferralsCount: jest.fn().mockReturnValue({ data: 123 }),
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
  useCoin: jest.fn().mockReturnValue({
    coin: {
      label: 'USDC',
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      balance: 250000n,
    },
    isLoading: false,
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
  useRootScreenParams: jest.fn().mockReturnValue([{ nav: 'home', token: undefined }, jest.fn()]),
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

jest.mock('app/utils/useIsSendingUnlocked', () => ({
  useIsSendingUnlocked: jest.fn().mockReturnValue({
    isSendingUnlocked: true,
    isLoading: false,
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

import { usePathname } from 'expo-router'
// @ts-expect-error mock
usePathname.mockReturnValue('/')

// there's a lot going on in the HomeScreen that needs to be mocked
// skip for now
test.skip('HomeScreen', async () => {
  jest.useFakeTimers()
  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <HomeScreen />
    </TamaguiProvider>
  )
  await act(async () => {
    jest.advanceTimersByTime(2000)
    jest.runAllTimers()
  })
  expect(screen.toJSON()).toMatchSnapshot()
})
