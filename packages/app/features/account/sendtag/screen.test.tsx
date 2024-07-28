import { describe, expect, it } from '@jest/globals'
import { act, render, screen } from '@testing-library/react-native'
import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { SendTagScreen } from './screen'

const mockTags = [
  {
    name: 'tag1',
    status: 'confirmed',
  },
  {
    name: 'tag2',
    status: 'confirmed',
  },
  { name: 'tag3', status: 'pending' },
]

jest.mock('solito/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}))

jest.mock('app/utils/useUser', () => {
  return {
    useUser: () => ({
      profile: {
        name: 'No Name',
        avatar_url: 'https://example.com',
      },
      user: {
        id: '123',
      },
      tags: mockTags,
    }),
  }
})

describe('SendTagScreen', () => {
  it('should render', async () => {
    jest.useFakeTimers()
    render(
      <Wrapper>
        <SendTagScreen />
      </Wrapper>
    )
    await act(async () => {
      jest.advanceTimersByTime(1000)
      jest.runAllTimers()
    })
    expect(screen.getByText(/REGISTERED SENDTAGS/)).toBeVisible()
    for (const tag of mockTags) {
      if (tag.status === 'pending') {
        expect(screen.queryByText(tag.name)).toBeFalsy()
        return
      }
      expect(screen.getByText(tag.name)).toBeVisible()
    }
    expect(screen.getByRole('button', { name: 'Add Tag' })).toBeVisible()
  })
})
