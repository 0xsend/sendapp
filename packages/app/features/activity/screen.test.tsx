import { expect, test } from '@jest/globals'
import { TamaguiProvider, View as MockView, config } from '@my/ui'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ActivityScreen } from './screen'

jest.mock('app/utils/supabase/useSupabase', () => ({
  useSupabase: jest.fn().mockReturnValue({
    rpc: jest.fn().mockReturnValue({
      abortSignal: jest.fn().mockReturnValue({
        data: [
          {
            tag_name: 'test',
            avatar_url: 'https://avatars.githubusercontent.com/u/123',
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

test('ActivityScreen', () => {
  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <ActivityScreen />
    </TamaguiProvider>
  )
  expect(screen.toJSON()).toMatchSnapshot('ActivityScreen')
})

test('ActivityScreen: search', async () => {
  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <ActivityScreen />
    </TamaguiProvider>
  )
  const searchInput = screen.getByPlaceholderText('Search')
  fireEvent.changeText(searchInput, 'test')
  expect(searchInput.props.value).toBe('test')
  const searchResults = await screen.findByTestId('tag-search-test')
  expect(searchResults).toHaveTextContent('??test')
  expect(screen.toJSON()).toMatchSnapshot('ActivityScreen: search')
})
