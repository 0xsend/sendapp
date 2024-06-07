import '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react-native'
import { Provider } from 'app/__mocks__/app/provider'
import { useAccount } from 'wagmi'
import { DepositWeb3Screen } from './screen'

jest.mock('wagmi')

describe('DepositWeb3Screen', () => {
  it('renders the deposit web3 screen when web3 wallet is connected', async () => {
    render(
      <Provider>
        <DepositWeb3Screen />
      </Provider>
    )
    await waitFor(() => expect(screen.getByText(`Depositing from ${'0x123'}`)).toBeVisible())
    expect(screen).toMatchSnapshot()
  })
  it('renders the deposit web3 screen when web3 wallet is not connected', async () => {
    // @ts-expect-error mock
    useAccount.mockReturnValue({
      isConnected: false,
    })
    render(
      <Provider>
        <DepositWeb3Screen />
      </Provider>
    )
    await waitFor(() => expect(screen.getByText('Connect to Deposit')).toBeVisible())
    expect(screen).toMatchSnapshot()
  })
})
