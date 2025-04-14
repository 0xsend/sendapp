import { expect, test } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { act, render } from '@testing-library/react-native'
import { OnboardingScreen } from './screen'

// TODO: handle the root provider in a better way
jest.mock('solito/router', () => ({
  useRouter: jest.fn().mockReturnValue(
    jest.fn().mockReturnValue({
      params: {},
    })
  ),
}))

// TODO: handle the root provider in a better way
jest.mock('expo-router', () => ({
  router: {
    useRoute: jest.fn().mockReturnValue({
      params: {},
    }),
    replace: jest.fn(),
  },
  useSegments: jest.fn().mockReturnValue({
    setSegment: jest.fn(),
  }),
}))

jest.mock('app/utils/supabase/client.native', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    }),
    // TODO: handle the root provider in a better way
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn().mockReturnValue(Promise.resolve({ data: { session: { user: {} } } })),
    },
  },
}))

jest.mock('app/utils/useWebauthnCredentials', () => ({
  useWebauthnCredentials: jest.fn().mockReturnValue({
    data: null,
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  }),
}))

jest.mock('app/utils/send-accounts', () => ({
  useSendAccounts: jest.fn().mockReturnValue({
    data: null,
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  }),
  useSendAccount: jest.fn().mockReturnValue({
    data: null,
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  }),
}))

jest.mock('app/utils/userop', () => ({
  ...jest.requireActual('app/utils/userop'),
  receiverAccount: {
    address: '0x123',
  },
}))

jest.mock('app/utils/api', () => ({
  api: {
    sendAccount: {
      create: {
        useMutation: jest.fn().mockReturnValue({
          mutateAsync: jest.fn().mockReturnValue(Promise.resolve()),
        }),
      },
    },
  },
}))

afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks()
})

test(OnboardingScreen.name, async () => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'))
  jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('foobar')
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <OnboardingScreen />
    </TamaguiProvider>
  ).toJSON()
  await act(async () => {
    jest.runAllTimers()
  })
  expect(tree).toMatchSnapshot()
})
