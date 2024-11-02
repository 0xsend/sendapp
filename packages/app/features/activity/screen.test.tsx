import { expect } from '@jest/globals'
import { TamaguiProvider, View as MockView, config } from '@my/ui'
import { act, render, screen } from '@testing-library/react-native'
import { ActivityScreen } from './screen'

jest.mock('app/utils/useSearchResultHref')

jest.mock('app/features/activity/utils/useActivityFeed')

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
}))

jest.mock('app/routers/params', () => ({
  useRootScreenParams: jest.fn().mockReturnValue([{ search: 'test' }, jest.fn()]),
}))

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
            address_matches: [],
          },
        ],
        error: null,
      }),
    }),
  }),
}))

jest.mock('solito/link', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <MockView dataSet={{ href }}>{children}</MockView>
  ),
  useLink: jest.fn().mockReturnValue({ href: '/profile/123', onPress: jest.fn() }),
}))

describe('ActivityScreen', () => {
  it('renders activity screen', async () => {
    jest.useFakeTimers()
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityScreen />
      </TamaguiProvider>
    )
    await act(async () => {
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })
    expect(screen.toJSON()).toMatchSnapshot('ActivityScreen')
  })

  it('returns the correct search results', async () => {
    jest.useFakeTimers()
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityScreen />
      </TamaguiProvider>
    )

    await act(async () => {
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })
  })
})
