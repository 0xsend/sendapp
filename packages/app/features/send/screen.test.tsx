import * as solito from 'solito'
import { describe, expect, it } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  usePathname: jest.fn().mockReturnValue('/send'),
}))

// const params = {}

jest.mock('solito', () => {
  // console.log('mock solito')
  const mockCreateParam = jest.fn(() => {
    // console.log('createParam in')
    return {
      useParam: jest.fn((args) => {
        // console.log('useParam', args)
        return ['test', jest.fn()]
      }),
      useParams: jest.fn((args) => {
        // console.log('useParams', args)
        return ['test', jest.fn()]
      }),
    }
  })
  return {
    __esModule: true,
    createParam: mockCreateParam,
  }
})

jest.mock('app/utils/useProfileLookup')
jest.mock('@my/wagmi')

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

import { SendScreen } from './screen'

describe('SendScreen', () => {
  it('should render with search', async () => {
    jest.useFakeTimers()

    const tree = render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <SendScreen />
      </TamaguiProvider>
    ).toJSON()

    act(() => {
      jest.runAllTimers()
    })

    expect(tree).toMatchSnapshot('render')

    expect(await screen.findByText('SEARCH BY')).toBeOnTheScreen()
    expect(solito.createParam).toHaveBeenCalled()

    const searchBy = await screen.findByRole('search', { name: 'query' })
    const user = userEvent.setup()

    await act(async () => {
      await user.type(searchBy, 'test')
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
      await waitFor(() => screen.findByTestId('searchResults'))
    })

    expect(screen.toJSON()).toMatchSnapshot('search')
    expect(screen.getByTestId('tag-search-3665')).toHaveTextContent('??test@test')
    const avatar = screen.getByTestId('avatar')
    expect(avatar).toBeOnTheScreen()
    expect(avatar.props.source.uri).toBe('https://avatars.githubusercontent.com/u/123')
    const link = screen.getByTestId('MockSolitoLink')
    expect(link).toBeOnTheScreen()
    expect(link.props.href).toBe(
      '/send?idType=tag&recipient=test&amount=test&sendToken=test&note=test'
    )
  })
})
