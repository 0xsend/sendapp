import { useUserOpTransferMutation } from './useUserOpTransferMutation'
import { Wrapper } from './__mocks__/Wrapper'
import { renderHook } from '@testing-library/react-hooks'
import { test } from '@jest/globals'
import { type SendAccountQuery } from './send-accounts/useSendAccounts'
import { useBytecode } from 'wagmi'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
jest.mock('wagmi')

test.skip('should return userop for transferring from send account to address', () => {
  // @ts-expect-error mock
  const sendAccount = { address: '0x123', init_code: '0x456' } as SendAccountQuery
  // @ts-expect-error mock
  useBytecode.mockReturnValue({
    data: null, // Simulate uninitialized account
    isSuccess: true,
    isFetched: true,
    error: null,
  })
  const { result } = renderHook(
    () =>
      useUserOpTransferMutation({
        sendAccount,
        token: undefined,
        amount: 1n,
        to: privateKeyToAddress(generatePrivateKey()),
      }),
    {
      wrapper: Wrapper,
    }
  )

  expect(result.current).toBe(null)
})
