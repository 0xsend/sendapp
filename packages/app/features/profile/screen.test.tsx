import { test } from '@jest/globals'
import { ProfileScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'
import { render, screen, act, userEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
    },
    baseMainnetBundlerClient: {
      transport: {
        url: 'http://127.0.0.1',
      },
    },
  }
})

test('ProfileScreen', async () => {
  jest.useFakeTimers()

  render(
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ProfileScreen />
      </TamaguiProvider>
    </QueryClientProvider>
  )

  await act(() => jest.runAllTimers())

  const h1 = screen.getByText(PROFILE.name)
  expect(h1).toBeOnTheScreen()
  const h2 = screen.getByText(`@${PROFILE.tag_name}`)
  expect(h2).toBeOnTheScreen()
  const paragraph = screen.getByText(PROFILE.about)
  expect(paragraph).toBeOnTheScreen()
  const avatar = screen.getByTestId('avatar')
  expect(avatar).toBeOnTheScreen()
  const image = screen.getByRole('image', { name: PROFILE.name })
  expect(image).toBeOnTheScreen()
  expect(image.props.source).toStrictEqual({
    uri: PROFILE.avatar_url,
  })
  const button1 = screen.getByTestId('openSendDialogButton')
  expect(button1).toBeOnTheScreen()
  const button2 = screen.getByText('Request')
  expect(button2).toBeOnTheScreen()
  expect(screen.toJSON()).toMatchSnapshot('ProfileScreen')

  await act(async () => {
    // await user.press(button1) // @note this does not work
    button1.props.onPress()
    jest.runAllTimers()
  })

  const dialog = screen.getByTestId('sendDialogContainer')
  expect(dialog).toBeOnTheScreen()
})
