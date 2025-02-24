import '@testing-library/jest-native/extend-expect'
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react-native'
import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { SendTagScreen } from './screen'

// Add mock for getLocalhost
jest.mock('app/utils/getLocalhost.native', () => ({
  getLocalhost: () => 'localhost',
}))

// Mock the query client to prevent refetch intervals
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query') as object
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
      refetchQueries: jest.fn(),
    }),
  }
})

// Add mock for api
jest.mock('app/utils/api', () => ({
  api: {
    sendAccount: {
      updateMainTag: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
    },
    tag: {
      delete: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
    },
  },
}))

const mockTags = [
  {
    id: 1,
    name: 'tag1',
    status: 'confirmed',
  },
  {
    id: 2,
    name: 'tag2',
    status: 'confirmed',
  },
  {
    id: 3,
    name: 'tag3',
    status: 'pending',
  },
]

jest.mock('solito/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}))

jest.mock('app/utils/useUser', () => ({
  useUser: () => ({
    profile: {
      name: 'No Name',
      avatar_url: 'https://example.com',
    },
    user: {
      id: '123',
    },
    tags: mockTags,
    isLoading: false,
  }),
}))

jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: () => ({
    data: {
      id: 1,
      main_tag_id: 1,
    },
    isLoading: false,
  }),
}))

describe('SendTagScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render', async () => {
    render(
      <Wrapper>
        <SendTagScreen />
      </Wrapper>
    )

    // Use a single act to handle initial render and any immediate effects
    await act(async () => {
      jest.advanceTimersByTime(0)
    })
    expect(screen.getByText(/Registered/)).toBeOnTheScreen()
    for (const tag of mockTags) {
      if (tag.status === 'pending') {
        expect(screen.queryByText(tag.name)).not.toBeOnTheScreen()
        return
      }
      expect(screen.getByText(tag.name)).toBeOnTheScreen()
    }
    expect(screen.getByRole('button', { name: 'Add Tag' })).toBeOnTheScreen()
  })
})
