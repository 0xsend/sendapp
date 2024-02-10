import { useBytecode } from 'wagmi'
import { test } from '@jest/globals'
import { SendAccountQuery } from './send-accounts/useSendAccounts'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useSendAccountInitCode } from './useSendAccountInitCode'
import { assert } from './assert'
import { Wrapper } from './__mocks__/Wrapper'

jest.mock('wagmi')

describe('useSendAccountInitCode', () => {
  test('should indicate loading when byteCode is being fetched', async () => {
    // @ts-expect-error mock
    useBytecode.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })
    const sendAccount = { address: '0x123', init_code: '0x456' } as unknown as SendAccountQuery
    const { result, unmount } = renderHook(() => useSendAccountInitCode({ sendAccount }), {
      wrapper: Wrapper,
    })
    await act(async () => {
      await waitFor(() => expect(result.current.isPending).toBe(true))
    })
    expect(result.current).toMatchObject({
      data: undefined,
      isPending: true,
      error: null,
    })
    unmount()
  })
  test('should return initCode when byteCode data is null (uninitialized account)', async () => {
    // @ts-expect-error mock
    useBytecode.mockReturnValue({
      data: null, // Simulate uninitialized account
      isSuccess: true,
      isFetched: true,
      error: null,
    })
    const sendAccount = { address: '0x123', init_code: '0x456' } as unknown as SendAccountQuery
    const { result, unmount } = renderHook(() => useSendAccountInitCode({ sendAccount }), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current).toMatchObject({
      data: '0x456',
      isLoading: false,
      error: null,
    })
    unmount()
  })
  test('should return 0x when byteCode data is not null (initialized account)', async () => {
    // @ts-expect-error mock
    useBytecode.mockReturnValue({
      data: '0x123', // Simulate initialized account
      isSuccess: true,
      isFetched: true,
      error: null,
    })
    const sendAccount = { address: '0x123', init_code: '0x456' } as unknown as SendAccountQuery
    const { result, unmount } = renderHook(() => useSendAccountInitCode({ sendAccount }), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current).toMatchObject({
      data: '0x',
      isLoading: false,
      error: null,
    })
    unmount()
  })
  test('should handle errors during byteCode fetching', async () => {
    // @ts-expect-error mock
    useBytecode.mockReturnValue({
      data: undefined,
      isSuccess: false,
      error: new Error('byteCodeError'), // Simulate an error
      isFetched: true,
    })

    // jest.useFakeTimers()
    const sendAccount = { address: '0x123', init_code: '0x456' } as unknown as SendAccountQuery
    const { result, unmount } = renderHook(() => useSendAccountInitCode({ sendAccount }), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
    assert(result.current.error instanceof Error, 'Expected error to be an instance of Error')
    expect(result.current.error.message).toContain('byteCodeError')
    unmount()
  })

  test('should be pending when no send account provided', async () => {
    // @ts-expect-error mock
    useBytecode.mockReturnValue({
      data: null,
      isLoading: false,
      isFetched: true,
      isSuccess: true,
      error: null,
    })
    const { result, unmount } = renderHook(() => useSendAccountInitCode({}), {
      wrapper: Wrapper,
    })
    await act(async () => {
      await waitFor(() => expect(result.current.isPending).toBe(true))
    })
    expect(result.current).toMatchObject({
      data: undefined,
      isPending: true,
      error: null,
    })

    unmount()
  })
})
