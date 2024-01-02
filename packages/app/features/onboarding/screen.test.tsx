import { expect, test } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import { OnboardingScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'

// TODO: handle the root provider in a better way
import { Provider } from 'app/provider'

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

// TODO: handle the root provider in a better way
jest.mock('@vonovak/react-native-theme-control', () => ({
  useThemePreference: jest.fn().mockReturnValue('light'),
  setThemePreference: jest.fn(),
}))

// TODO: handle the root provider in a better way
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: jest.fn().mockReturnValue({
    type: 'wifi',
    isConnected: true,
  }),
  addEventListener: jest.fn(),
}))

jest.mock('@daimo/expo-passkeys', () => ({
  createPasskey: jest.fn(),
  signWithPasskey: jest.fn(),
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

// TODO: handle the root provider in a better way
jest.mock('app/utils/useUser', () => ({
  useUser: jest.fn().mockReturnValue({
    user: {
      id: '123',
    },
  }),
}))

jest.mock('app/utils/useWebauthnCredentials', () => ({
  useWebauthnCredentials: jest.fn().mockReturnValue({
    data: null,
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  }),
}))

afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks()
})

jest.useFakeTimers()
jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'))
test(OnboardingScreen.name, () => {
  jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('foobar')
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <OnboardingScreen />
    </TamaguiProvider>
  ).toJSON()
  act(() => {
    jest.runAllTimers()
  })
  expect(tree).toMatchSnapshot()
})
