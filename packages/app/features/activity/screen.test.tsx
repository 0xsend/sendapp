import { expect } from '@jest/globals'
import { TamaguiProvider, View as MockView, config } from '@my/ui'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { ActivityScreen } from './screen'
import { useSearchResultHref } from 'app/utils/useSearchResultHref'

jest.mock('app/utils/useSearchResultHref')

jest.mock('app/features/activity/utils/useActivityFeed')

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
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
}))

describe('ActivityScreen', () => {
  beforeEach(() => {
    // @ts-expect-error mock
    useSearchResultHref.mockImplementation((item) => {
      return `/profile/${item.send_id}`
    })
  })

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
    const searchInput = screen.getByPlaceholderText('$Sendtag, Phone, Send ID')
    await act(async () => {
      fireEvent.changeText(searchInput, 'test')
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
      await waitFor(() => screen.findByTestId('tag-search-3665'))
    })

    expect(searchInput.props.value).toBe('test')
    const searchResults = await screen.findByTestId('tag-search-3665')
    expect(searchResults).toHaveTextContent('??test@test')
  })
})
