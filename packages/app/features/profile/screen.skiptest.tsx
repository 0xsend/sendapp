import { test, jest, expect } from '@jest/globals'
import { ProfileScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'
import { act, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRootScreenParams } from 'app/routers/params'

const useRootScreenParamsMock = useRootScreenParams as jest.Mock

const queryClient = new QueryClient()
const TAG_NAME = 'pip_test44677'
const PROFILE = {
  avatar_url:
    'https://fjswgwdweohwejbrmiil.supabase.co/storage/v1/object/public/avatars/db59dfd6-16e6-4c30-8337-4bb33905828f/1697315518383.jpeg',
  name: 'Mabel Bechtelar',
  about:
    'Doctissimae poster est quibus solut quae concuriosum quod, disputatur sit voluptate ea interror pugnantium est conspecta.',
  referral_code: 'p2us75d2560',
  tag_name: TAG_NAME,
  address: '0x3D0B692e4b10A6975658808a6DB9F56C89d3d4a4',
  chain_id: 845337,
  all_tags: [TAG_NAME],
  id: 2,
}

jest.mock('solito', () => ({
  useRoute: () => ({ params: { tag: TAG_NAME } }),
  createParam: jest.fn().mockReturnValue({
    useParam: jest.fn().mockReturnValue([TAG_NAME]),
  }),
}))

jest.mock('app/utils/useProfileLookup', () => ({
  useProfileLookup: jest.fn().mockReturnValue({
    data: PROFILE,
    error: null,
  }),
}))

jest.mock('app/utils/useUser', () => ({
  useUser: jest.fn().mockReturnValue({
    user: {
      id: '1',
    },
  }),
}))

jest.mock('./utils/useInterUserActivityFeed', () => ({
  useInterUserActivityFeed: jest.fn().mockReturnValue({
    isLoading: false,
    error: null,
    isFetching: false,
    isFetchingNextPage: false,
    fetchNextPage: () => {},
    hasNextPage: false,
    data: {
      pages: [
        [
          {
            created_at: new Date('2024-5-19 GMT'),
            event_name: 'send_account_transfers',
            from_user: { id: 1 },
            to_user: { id: 2 },
            data: {
              v: 10000n,
              note: 'test note',
            },
          },
        ],
      ],
    },
  }),
}))

jest.mock('app/utils/send-accounts')

jest.mock('wagmi')

jest.mock('@my/wagmi', () => {
  const originalModule = jest.requireActual<typeof import('@my/wagmi')>('@my/wagmi')
  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    baseMainnetClient: {
      transport: {
        url: 'http://127.0.0.1',
      },
      chain: {
        id: 845337,
      },
    },
    sendBaseMainnetBundlerClient: {
      transport: {
        url: 'http://127.0.0.1',
      },
    },
  }
})

jest.mock('solito/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}))

jest.mock('app/routers/params', () => ({
  useProfileScreenParams: jest.fn().mockReturnValue([{ sendid: 0 }, jest.fn()]),
  useRootScreenParams: jest.fn().mockReturnValue([{}, jest.fn()]),
}))

test('ProfileScreen', async () => {
  jest.useFakeTimers()

  render(
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ProfileScreen />
      </TamaguiProvider>
    </QueryClientProvider>
  )

  await waitFor(() => expect(screen.getByText(PROFILE.name)).toBeVisible())
  await act(async () => {
    jest.advanceTimersByTime(5000)
    jest.runAllTimers()
  })
  const h1 = screen.getByText(PROFILE.name)
  expect(h1).toBeOnTheScreen()
  const avatar = screen.getByTestId('avatar')
  expect(avatar).toBeOnTheScreen()
  const image = screen.getByRole('image', { name: PROFILE.name })
  expect(image).toBeOnTheScreen()
  expect(image.props.source).toStrictEqual({
    uri: PROFILE.avatar_url,
  })

  const activity = screen.getByTestId('activityTest')
  expect(activity).toBeOnTheScreen()
  const activityLabel = screen.getByText('You Sent')
  expect(activityLabel).toBeOnTheScreen()

  expect(screen.toJSON()).toMatchSnapshot('ProfileScreen')
})

test('ProfileScreen with opened modal', async () => {
  useRootScreenParamsMock.mockReturnValue([{ profile: 0 }, jest.fn()])

  render(
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ProfileScreen />
      </TamaguiProvider>
    </QueryClientProvider>
  )
  await act(async () => {
    jest.advanceTimersByTime(5000)
    jest.runAllTimers()
  })

  expect(screen.getByTestId('profile-about-tile')).toBeOnTheScreen()
})
