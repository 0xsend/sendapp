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
      useParam: jest.fn(() => {
        // console.log('useParam', name, opts)
        return ['test', jest.fn()]
      }),
      useParams: jest.fn(() => {
        // console.log('useParams', name, opts)
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
import { usePathname } from 'expo-router'
import { useProfileLookup } from 'app/utils/useProfileLookup'

describe('SendScreen', () => {
  it('should render with search when on /send and no recipient in params', async () => {
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

  it('should render /send check when no send account', async () => {
    // @ts-expect-error mock
    usePathname.mockReturnValue('/send?recipient=test&idType=tag')
    // @ts-expect-error mock
    useProfileLookup.mockReturnValue({
      data: {
        avatar_url: 'https://avatars.githubusercontent.com/u/123',
        name: 'test',
        about: 'test',
        refcode: 'test',
        tag: 'test',
        address: null,
        phone: 'test',
        chain_id: 1,
        is_public: true,
        sendid: 1,
        all_tags: ['test'],
      },
      isLoading: false,
      error: null,
    })

    jest.useFakeTimers()
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <SendScreen />
      </TamaguiProvider>
    )

    await act(async () => {
      jest.runAllTimers()
      await waitFor(() => screen.getByText('Write /send Check'))
    })

    expect(screen.toJSON()).toMatchSnapshot('render')

    // screen.debug('amount form')
    expect(screen.getByTestId('NoSendAccountLink')).toHaveTextContent(
      '@test has no send account! Ask them to create one or write a /send Check.'
    )
  })
})
