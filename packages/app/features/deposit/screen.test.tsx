import '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react-native'
import { Provider } from 'app/__mocks__/app/provider'
import { useAccount } from 'wagmi'
import { DepositScreen } from './screen'

jest.mock('@my/ui', () => ({
  ...jest.requireActual('@my/ui'),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => {
    console.log('AnimatePresence', children)
    return children
  },
}))

jest.mock('wagmi')

describe('DepositScreen', () => {
  it('renders the deposit screen', async () => {
    render(
      <Provider>
        <DepositScreen />
      </Provider>
    )

    // screen.debug({ message: 'DepositScreen: render' })
    await waitFor(() => expect(screen.getByText('Deposit funds')).toBeVisible())
    await waitFor(() => expect(screen.getByText('Web3 Wallet')).toBeVisible())
    // await waitFor(() => expect(screen.getByText('Coinbase Pay')).toBeVisible())
    await waitFor(() => expect(screen.getByText('Coming Soon')).toBeVisible())
    expect(screen).toMatchSnapshot()
  })
})
