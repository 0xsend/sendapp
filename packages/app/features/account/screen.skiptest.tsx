import { describe, it, jest, expect } from '@jest/globals'
import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { AccountScreen } from './screen'
import { render, screen, act } from '@testing-library/react-native'

jest.mock('app/utils/useUser')
jest.mock('app/utils/tags', () => ({
  useConfirmedTags: jest.fn().mockReturnValue([{ name: 'test' }]),
}))
jest.mock('app/utils/getReferralLink', () => ({
  getReferralHref: jest.fn().mockReturnValue('https://send.it/123'),
}))
jest.mock('app/routers/params', () => ({
  useRootScreenParams: jest.fn().mockReturnValue([{ nav: 'home', token: undefined }, jest.fn()]),
}))

jest.mock('app/utils/useUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue({ data: 10 }),
}))

describe('AccountScreen', () => {
  it('renders the account screen', async () => {
    jest.useFakeTimers()
    render(
      <Wrapper>
        <AccountScreen />
      </Wrapper>
    )
    await act(async () => {
      jest.runAllTimers()
    })

    expect(screen.toJSON()).toMatchSnapshot('AccountScreen')
  })
})
