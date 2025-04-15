import { describe, it, jest, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import { Provider } from 'app/__mocks__/app/provider'
import { DepositScreen } from './screen'

jest.mock('wagmi')

jest.mock('@my/ui', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: this is for testing
  ...(jest.requireActual('@my/ui') as any),
  Fade: ({ children }) => children,
}))

describe('DepositScreen', () => {
  it('renders the deposit screen', async () => {
    render(
      <Provider>
        <DepositScreen />
      </Provider>
    )

    expect(screen.getByText('Crypto Wallet')).toBeOnTheScreen()
    expect(screen.getByText('Apple Pay')).toBeOnTheScreen()
    expect(screen.getByText('Debit Card')).toBeOnTheScreen()
    expect(screen).toMatchSnapshot()
  })
})
