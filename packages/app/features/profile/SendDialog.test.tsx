import { describe, test, beforeEach, expect } from '@jest/globals'
import { act, render, userEvent, screen, waitFor } from '@testing-library/react-native'
import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { SendDialog } from './SendDialog'
import { useUserOpTransferMutation } from 'app/utils/useUserOpTransferMutation'
import { useBalance } from 'wagmi'
import { Animated, View } from 'react-native'

const TAG_NAME = 'pip_test44677'
const PROFILE = {
  id: '1',
  avatar_url:
    'https://fjswgwdweohwejbrmiil.supabase.co/storage/v1/object/public/avatars/db59dfd6-16e6-4c30-8337-4bb33905828f/1697315518383.jpeg',
  name: 'Mabel Bechtelar',
  about:
    'Doctissimae poster est quibus solut quae concuriosum quod, disputatur sit voluptate ea interror pugnantium est conspecta.',
  referral_code: 'p2us75d2560',
  tag_name: TAG_NAME,
  address: '0x3D0B692e4b10A6975658808a6DB9F56C89d3d4a4',
  chain_id: 845337,
  is_public: true,
} as const

jest.mock('app/utils/useUserOpTransferMutation')
jest.mock('app/utils/useSendAccountInitCode', () => ({
  useSendAccountInitCode: jest.fn().mockReturnValue({
    data: `0x${'3'.repeat(60)}`,
    isSuccess: true,
    isPending: false,
    error: null,
  }),
}))
jest.mock('permissionless', () => ({
  _esModule: true,
  ...jest.requireActual('permissionless'),
  getAccountNonce: jest.fn().mockReturnValue(Promise.resolve(BigInt(0))),
}))
describe('SendDialog', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  test('it can send', async () => {
    Object.defineProperty(Animated, 'View', {
      get value() {
        return View
      },
    })
    const mockMutateAsync = jest.fn().mockReturnValueOnce({
      hash: '0x123',
      success: true,
      receipt: {
        transactionHash: '0x123',
      },
    })
    const mockBalanceRefetch = jest.fn()
    // @ts-expect-error mock
    useBalance.mockReturnValue({
      data: {
        value: 100000000000000000000n,
        decimals: 18,
        formatted: '100',
        symbol: 'ETH',
      },
      refetch: mockBalanceRefetch,
    })

    // @ts-expect-error mock
    useUserOpTransferMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
    })

    render(
      <Wrapper>
        <SendDialog profile={PROFILE} open={true} />
      </Wrapper>
    )

    await act(async () => {
      jest.runAllTimers()
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })

    const user = userEvent.setup()

    const dialog = screen.getByTestId('sendDialogContainer')
    const form = screen.getByTestId('SendForm')
    expect(dialog).toBeOnTheScreen()
    expect(form).toBeOnTheScreen()
    const amount = screen.getByLabelText('Amount')
    const token = screen.getByTestId('TokenSelectTrigger')
    const submit = screen.getByTestId('SubmitButton')
    expect(amount).toBeOnTheScreen()
    expect(token).toHaveTextContent('Token') // this is the placeholder
    expect(submit).toBeOnTheScreen()
    await act(async () => {
      await submit.props.onPress() // trigger validation
      jest.advanceTimersByTime(2000)
      jest.runAllTimers()
    })
    // @todo figure out how to get errors to show with tooltips
    // await waitFor(() => screen.getByText('Required'))
    // expect(screen.getByText('Required')).toBeOnTheScreen()
    expect(screen.toJSON()).toMatchSnapshot('SendForm Error')
    await act(async () => {
      await user.type(amount, '3.50')
      jest.runAllTimers()
    })
    await waitFor(() =>
      expect(screen.getByTestId('SendFormBalance')).toHaveTextContent('ETH Balance: 100')
    )
    expect(screen.toJSON()).toMatchSnapshot('SendForm')

    await act(async () => {
      await submit.props.onPress() // trigger submit
      jest.runAllTimers()
    })

    expect(mockMutateAsync).toHaveBeenCalled()
    expect(mockMutateAsync).toHaveBeenCalledWith({
      sender: '0xb0b0000000000000000000000000000000000000',
      token: '',
      amount: 3500000000000000000n,
      to: '0x3D0B692e4b10A6975658808a6DB9F56C89d3d4a4',
      nonce: 0n,
    })
  })
})
