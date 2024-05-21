import { expect, test } from '@jest/globals'
import { TamaguiProvider, View as MockView, config } from '@my/ui'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { ActivityScreen } from './screen'
import type { Json } from '@my/supabase/database-generated.types'
import type { Views } from '@my/supabase/database.types'

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

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({
    data: [
      {
        block_time: 1716346092,
        tx_hash: '0x123',
        block_num: 123,
        tx_idx: 123,
        log_idx: 123,
        table: 'send_account_created',
        logdata: {
          send_id: 123,
          avatar_url: 'https://avatars.githubusercontent.com/u/123',
        },
      },
    ] as Views<'send_account_activity'>[],
    isLoading: false,
    error: null,
  }),
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
  const searchInput = screen.getByPlaceholderText('Name, $Sendtag, Phone')
  await act(async () => {
    fireEvent.changeText(searchInput, 'test')
    jest.advanceTimersByTime(2000)
    jest.runAllTimers()
    await waitFor(() => screen.findByTestId('tag-search-3665'))
  })

  expect(searchInput.props.value).toBe('test')
  const searchResults = await screen.findByTestId('tag-search-3665')
  expect(searchResults).toHaveTextContent('??test@test')
  expect(screen.toJSON()).toMatchSnapshot('ActivityScreen: search')
})
