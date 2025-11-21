import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useCantonWallet } from './useCantonWallet'
import { Platform } from 'react-native'
import * as Clipboard from 'expo-clipboard'

// Mock dependencies
jest.mock('./api', () => ({
  api: {
    cantonWallet: {
      generatePriorityToken: {
        useMutation: jest.fn(),
      },
    },
  },
}))

jest.mock('@my/ui', () => ({
  useAppToast: jest.fn(),
}))

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}))

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}))

// Type imports
import { api } from './api'
import { useAppToast } from '@my/ui'
import * as Linking from 'expo-linking'

const apiMock = api as jest.Mocked<typeof api>
const useAppToastMock = useAppToast as jest.MockedFunction<typeof useAppToast>
const clipboardMock = Clipboard.setStringAsync as jest.MockedFunction<
  typeof Clipboard.setStringAsync
>
const linkingMock = Linking.openURL as jest.MockedFunction<typeof Linking.openURL>

// Mock navigator globally for web tests
const mockNavigator = {
  clipboard: {
    writeText: jest.fn<typeof navigator.clipboard.writeText>(),
  },
}

// @ts-expect-error - Global type augmentation for tests
global.navigator = mockNavigator as typeof navigator

// Helper to create a properly typed mock mutation result
function createMockMutationResult(
  overrides: Partial<ReturnType<typeof apiMock.cantonWallet.generatePriorityToken.useMutation>> = {}
): ReturnType<typeof apiMock.cantonWallet.generatePriorityToken.useMutation> {
  return {
    mutate: jest.fn(),
    isPending: false,
    error: null,
    isSuccess: false,
    data: undefined,
    isError: false,
    isIdle: true,
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    status: 'idle',
    submittedAt: 0,
    variables: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    trpc: { path: 'cantonWallet.generatePriorityToken' },
    ...overrides,
  } as ReturnType<typeof apiMock.cantonWallet.generatePriorityToken.useMutation>
}

describe('useCantonWallet', () => {
  const mockToast = {
    show: jest.fn<ReturnType<typeof useAppToast>['show']>(),
    error: jest.fn<ReturnType<typeof useAppToast>['error']>(),
    hide: jest.fn<ReturnType<typeof useAppToast>['hide']>(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useAppToastMock.mockReturnValue(mockToast)
    mockNavigator.clipboard.writeText.mockClear()
    mockNavigator.clipboard.writeText.mockResolvedValue(undefined)
  })

  afterEach(() => {
    // Reset Platform.OS to avoid cross-test pollution
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true })
  })

  describe('generatePriorityToken', () => {
    it('should return hook interface with correct properties', () => {
      const mockMutate = jest.fn()
      apiMock.cantonWallet.generatePriorityToken.useMutation.mockReturnValue(
        createMockMutationResult({ mutate: mockMutate })
      )

      const { result } = renderHook(() => useCantonWallet())

      expect(result.current).toHaveProperty('generatePriorityToken')
      expect(result.current).toHaveProperty('isGenerating')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('isSuccess')
      expect(typeof result.current.generatePriorityToken).toBe('function')
    })

    it('should handle new token generation on web with clipboard', async () => {
      const mockUrl = 'https://cantonwallet.com/invite?token=abc123'
      type SuccessCallback = (
        data: { url: string; isNew: boolean },
        variables: Record<string, never>,
        context: unknown
      ) => void | Promise<void>
      let onSuccessCallback: SuccessCallback | undefined

      const mockMutate = jest.fn()
      // @ts-expect-error - Mock implementation type is complex, but the test validates the behavior
      apiMock.cantonWallet.generatePriorityToken.useMutation.mockImplementation((options) => {
        onSuccessCallback = options?.onSuccess as SuccessCallback | undefined
        return createMockMutationResult({ mutate: mockMutate })
      })

      // Mock web platform
      Object.defineProperty(Platform, 'OS', { value: 'web', writable: true })

      const { result } = renderHook(() => useCantonWallet())

      // Trigger the mutation
      result.current.generatePriorityToken()

      // Simulate the mutation success callback
      await onSuccessCallback?.({ url: mockUrl, isNew: true }, {}, undefined)

      await waitFor(() => {
        expect(clipboardMock).toHaveBeenCalledWith(mockUrl)
      })
      expect(mockToast.show).toHaveBeenCalledWith('Priority invite link copied!')
    })

    it('should handle existing token on web', async () => {
      const mockUrl = 'https://cantonwallet.com/invite?token=existing456'
      type SuccessCallback = (
        data: { url: string; isNew: boolean },
        variables: Record<string, never>,
        context: unknown
      ) => void | Promise<void>
      let onSuccessCallback: SuccessCallback | undefined

      const mockMutate = jest.fn()
      // @ts-expect-error - Mock implementation type is complex, but the test validates the behavior
      apiMock.cantonWallet.generatePriorityToken.useMutation.mockImplementation((options) => {
        onSuccessCallback = options?.onSuccess as SuccessCallback | undefined
        return createMockMutationResult({ mutate: mockMutate })
      })

      Object.defineProperty(Platform, 'OS', { value: 'web', writable: true })

      const { result } = renderHook(() => useCantonWallet())

      result.current.generatePriorityToken()
      await onSuccessCallback?.({ url: mockUrl, isNew: false }, {}, undefined)

      await waitFor(() => {
        expect(clipboardMock).toHaveBeenCalledWith(mockUrl)
      })
      expect(mockToast.show).toHaveBeenCalledWith('Your existing invite link has been copied')
    })

    it('should open invite URL on native', async () => {
      const mockUrl = 'https://cantonwallet.com/invite?token=native789'
      type SuccessCallback = (
        data: { url: string; isNew: boolean },
        variables: Record<string, never>,
        context: unknown
      ) => void | Promise<void>
      let onSuccessCallback: SuccessCallback | undefined

      const mockMutate = jest.fn()
      // @ts-expect-error - Mock implementation type is complex, but the test validates the behavior
      apiMock.cantonWallet.generatePriorityToken.useMutation.mockImplementation((options) => {
        onSuccessCallback = options?.onSuccess as SuccessCallback | undefined
        return createMockMutationResult({ mutate: mockMutate })
      })

      Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true })
      linkingMock.mockResolvedValue(true)

      const { result } = renderHook(() => useCantonWallet())

      result.current.generatePriorityToken()
      await onSuccessCallback?.({ url: mockUrl, isNew: true }, {}, undefined)

      await waitFor(() => {
        expect(linkingMock).toHaveBeenCalledWith(mockUrl)
      })
      expect(mockToast.show).toHaveBeenCalledWith('Opening Canton Wallet...')
    })

    it('should fallback to clipboard on native when opening fails', async () => {
      const mockUrl = 'https://cantonwallet.com/invite?token=fallback999'
      type SuccessCallback = (
        data: { url: string; isNew: boolean },
        variables: Record<string, never>,
        context: unknown
      ) => void | Promise<void>
      let onSuccessCallback: SuccessCallback | undefined

      const mockMutate = jest.fn()
      // @ts-expect-error - Mock implementation type is complex, but the test validates the behavior
      apiMock.cantonWallet.generatePriorityToken.useMutation.mockImplementation((options) => {
        onSuccessCallback = options?.onSuccess as SuccessCallback | undefined
        return createMockMutationResult({ mutate: mockMutate })
      })

      Object.defineProperty(Platform, 'OS', { value: 'android', writable: true })
      linkingMock.mockRejectedValue(new Error('Cannot open URL'))
      clipboardMock.mockResolvedValue(true)

      const { result } = renderHook(() => useCantonWallet())

      result.current.generatePriorityToken()
      await onSuccessCallback?.({ url: mockUrl, isNew: true }, {}, undefined)

      await waitFor(() => {
        expect(linkingMock).toHaveBeenCalledWith(mockUrl)
      })
      await waitFor(() => {
        expect(clipboardMock).toHaveBeenCalledWith(mockUrl)
      })
      expect(mockToast.show).toHaveBeenCalledWith('Invite link copied to clipboard')
    })

    it('should handle error with custom message', async () => {
      const mockError = new Error('Custom error message')
      type ErrorCallback = (
        error: unknown,
        variables: Record<string, never>,
        context: unknown
      ) => void
      let onErrorCallback: ErrorCallback | undefined

      const mockMutate = jest.fn()
      // @ts-expect-error - Mock implementation type is complex, but the test validates the behavior
      apiMock.cantonWallet.generatePriorityToken.useMutation.mockImplementation((options) => {
        onErrorCallback = options?.onError as ErrorCallback | undefined
        return createMockMutationResult({
          mutate: mockMutate,
          isPending: false,
          // @ts-expect-error - Error type mismatch acceptable in tests
          error: mockError,
          isSuccess: false,
          isError: true,
          isIdle: false,
          status: 'error',
          failureCount: 1,
          // @ts-expect-error - Error type mismatch acceptable in tests
          failureReason: mockError,
        })
      })

      const { result } = renderHook(() => useCantonWallet())

      result.current.generatePriorityToken()
      await onErrorCallback?.(mockError, {}, undefined)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Custom error message')
      })
    })

    it('should handle error with fallback message', async () => {
      const mockError = new Error()
      mockError.message = ''
      type ErrorCallback = (
        error: unknown,
        variables: Record<string, never>,
        context: unknown
      ) => void
      let onErrorCallback: ErrorCallback | undefined

      const mockMutate = jest.fn()
      // @ts-expect-error - Mock implementation type is complex, but the test validates the behavior
      apiMock.cantonWallet.generatePriorityToken.useMutation.mockImplementation((options) => {
        onErrorCallback = options?.onError as ErrorCallback | undefined
        return createMockMutationResult({
          mutate: mockMutate,
          isPending: false,
          // @ts-expect-error - Error type mismatch acceptable in tests
          error: mockError,
          isSuccess: false,
          isError: true,
          isIdle: false,
          status: 'error',
          failureCount: 1,
          // @ts-expect-error - Error type mismatch acceptable in tests
          failureReason: mockError,
        })
      })

      const { result } = renderHook(() => useCantonWallet())

      result.current.generatePriorityToken()
      await onErrorCallback?.(mockError, {}, undefined)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to generate invite')
      })
    })

    it('should expose isPending state as isGenerating', () => {
      apiMock.cantonWallet.generatePriorityToken.useMutation.mockReturnValue(
        createMockMutationResult({
          isPending: true,
          isIdle: false,
          status: 'pending',
          submittedAt: Date.now(),
        })
      )

      const { result } = renderHook(() => useCantonWallet())

      expect(result.current.isGenerating).toBe(true)
    })
  })
})
