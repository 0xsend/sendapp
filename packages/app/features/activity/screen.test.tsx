import { expect, test } from '@jest/globals'
import { TamaguiProvider, View as MockView, config } from '@my/ui'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { ActivityScreen } from './screen'

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

test('ActivityScreen', async () => {
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

test('ActivityScreen: search', async () => {
  jest.useFakeTimers()
  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <ActivityScreen />
    </TamaguiProvider>
  )
  const searchInput = screen.getByPlaceholderText('Name, $Sendtag, Phone, Email')
  await act(async () => {
    fireEvent.changeText(searchInput, 'test')
    jest.advanceTimersByTime(2000)
    jest.runAllTimers()
    await waitFor(() => screen.findByTestId('tag-search-3665'))
  })

  expect(searchInput.props.value).toBe('test')
  const searchResults = await screen.findByTestId('tag-search-3665')
  expect(searchResults).toHaveTextContent('??test')
  expect(screen.toJSON()).toMatchSnapshot('ActivityScreen: search')
})
