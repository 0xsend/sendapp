import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals'

import type { Debugger } from 'debug'

import {
  PASSKEY_DIAGNOSTIC_ERROR_MESSAGE,
  evaluatePasskeyDiagnostic,
  runPasskeyDiagnostic,
  __unsafeResetPasskeyDiagnosticCache,
  __unsafeGetWebPlatformSupportCache,
  isHighRiskPasskeyEnvironment,
  __unsafeMatchesHighRiskVendor,
  __unsafeSetPasskeyDiagnosticLogger,
  __unsafeResetPasskeyDiagnosticLogger,
} from './passkeyDiagnostic'
import { signChallenge } from './signChallenge'

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}))

jest.mock('expo-device', () => ({
  brand: null,
  manufacturer: null,
  modelName: null,
  osName: 'Android',
}))

jest.mock('react-native-device-info', () => ({
  hasGmsSync: jest.fn(() => false),
}))

jest.mock('./signChallenge', () => ({
  signChallenge: jest.fn(),
}))

const mockedSignChallenge = signChallenge as jest.MockedFunction<typeof signChallenge>
const reactNativeMock = jest.requireMock('react-native') as {
  Platform: { OS: string }
}
const mockedPlatform = reactNativeMock.Platform
const mockedDevice = jest.requireMock('expo-device') as {
  brand: string | null
  manufacturer: string | null
  modelName: string | null
  osName: string | null
}
const mockedHasGmsSync = (
  jest.requireMock('react-native-device-info') as {
    hasGmsSync: jest.MockedFunction<() => boolean>
  }
).hasGmsSync

const originalLogging = process.env.NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_LOGGING
const originalPublicKeyCredential = (globalThis as typeof globalThis).PublicKeyCredential

function setPublicKeyCredential(value: typeof PublicKeyCredential | undefined) {
  if (value === undefined) {
    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    return
  }

  Object.defineProperty(globalThis, 'PublicKeyCredential', {
    configurable: true,
    writable: true,
    value,
  })
}

function createPublicKeyCredentialMock(hasSupport: boolean) {
  const uvpaa = jest.fn(async () => hasSupport)
  const mock = (() => {
    // noop constructor replacement
  }) as unknown as typeof PublicKeyCredential

  Object.defineProperty(mock, 'isUserVerifyingPlatformAuthenticatorAvailable', {
    configurable: true,
    writable: true,
    value: uvpaa,
  })

  return { mock, uvpaa }
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_LOGGING = undefined
  __unsafeResetPasskeyDiagnosticCache()
  setPublicKeyCredential(originalPublicKeyCredential)
  __unsafeResetPasskeyDiagnosticLogger()
})

afterAll(() => {
  if (originalLogging) {
    process.env.NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_LOGGING = originalLogging
  } else {
    process.env.NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_LOGGING = undefined
  }

  setPublicKeyCredential(originalPublicKeyCredential)
})

describe('passkeyDiagnostic', () => {
  beforeEach(() => {
    mockedSignChallenge.mockReset()
    mockedPlatform.OS = 'android'
    mockedDevice.brand = null
    mockedDevice.manufacturer = null
    mockedDevice.modelName = null
    mockedDevice.osName = 'Android'
    mockedHasGmsSync.mockReturnValue(false)
  })

  it('returns success when signChallenge resolves', async () => {
    mockedSignChallenge.mockResolvedValue({
      accountName: 'user-id',
      keySlot: 0,
      encodedWebAuthnSig: '0x',
    })

    const result = await runPasskeyDiagnostic({
      allowedCredentials: [{ id: 'credential', userHandle: 'user-id.0' }],
    })

    expect(result).toEqual({ success: true })
    expect(mockedSignChallenge).toHaveBeenCalledTimes(1)
  })

  it('returns failure when signChallenge rejects', async () => {
    const error = new Error('fail')
    mockedSignChallenge.mockRejectedValue(error)

    const result = await runPasskeyDiagnostic({
      allowedCredentials: [{ id: 'credential', userHandle: 'user-id.0' }],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.cause).toBe(error)
    }
  })

  it('fails quickly when no credentials provided', async () => {
    const result = await runPasskeyDiagnostic({ allowedCredentials: [] })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect((result.cause as Error).message).toContain('No passkey credentials')
    }
    expect(mockedSignChallenge).not.toHaveBeenCalled()
  })

  it('should run in always mode', async () => {
    const decision = await evaluatePasskeyDiagnostic('always')
    expect(decision).toEqual({ shouldRun: true, reason: 'mode-always' })
  })

  it('runs in high-risk mode when user agent matches', async () => {
    const decision = await evaluatePasskeyDiagnostic(
      'high-risk',
      'Mozilla/5.0 (Linux; Android 13; vivo X90 Build/TP1A)'
    )
    expect(decision).toEqual({ shouldRun: true, reason: 'high-risk-environment' })
  })

  it('runs in high-risk mode when vendor fingerprint matches expanded OEM list', async () => {
    mockedDevice.brand = 'Realme'
    const decision = await evaluatePasskeyDiagnostic('high-risk')
    expect(decision).toEqual({ shouldRun: true, reason: 'high-risk-environment' })
  })

  it('skips when vendor matches but Google Mobile Services is available', async () => {
    mockedDevice.brand = 'Vivo'
    mockedHasGmsSync.mockReturnValue(true)
    const decision = await evaluatePasskeyDiagnostic('high-risk')
    expect(decision).toEqual({ shouldRun: false, reason: 'environment-not-high-risk' })
  })

  it('runs in high-risk mode when android vendor is unknown', async () => {
    mockedPlatform.OS = 'android'
    mockedDevice.osName = 'Android'
    mockedDevice.brand = null
    mockedDevice.manufacturer = null
    mockedDevice.modelName = null
    const decision = await evaluatePasskeyDiagnostic('high-risk')
    expect(decision).toEqual({ shouldRun: true, reason: 'high-risk-environment' })
  })

  it('runs in high-risk mode when device brand matches', async () => {
    mockedDevice.brand = 'Vivo'
    const decision = await evaluatePasskeyDiagnostic('high-risk')
    expect(decision).toEqual({ shouldRun: true, reason: 'high-risk-environment' })
  })

  it('runs in high-risk mode when user agent is a placeholder', async () => {
    mockedPlatform.OS = 'android'
    mockedDevice.osName = 'Android'
    mockedDevice.brand = null
    mockedDevice.manufacturer = null
    mockedDevice.modelName = null
    const decision = await evaluatePasskeyDiagnostic('high-risk', 'reactnative')
    expect(decision).toEqual({ shouldRun: true, reason: 'high-risk-environment' })
  })

  it('skips in high-risk mode for safe user agent', async () => {
    mockedPlatform.OS = 'ios'
    mockedDevice.osName = 'iOS'
    const decision = await evaluatePasskeyDiagnostic(
      'high-risk',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    )
    expect(decision).toEqual({ shouldRun: false, reason: 'environment-not-high-risk' })
  })

  it('skips when disabled', async () => {
    const decision = await evaluatePasskeyDiagnostic(
      'disabled',
      'Mozilla/5.0 (Linux; Android 13; vivo X90 Build/TP1A)'
    )
    expect(decision).toEqual({ shouldRun: false, reason: 'mode-disabled' })
  })

  it('runs when web UVPAA reports missing support', async () => {
    mockedPlatform.OS = 'web'
    mockedDevice.osName = 'web'
    const { mock, uvpaa } = createPublicKeyCredentialMock(false)
    setPublicKeyCredential(mock)

    expect(mockedPlatform.OS).toBe('web')
    expect(mockedDevice.osName).toBe('web')
    expect(mockedDevice.brand).toBeNull()
    expect(mockedDevice.manufacturer).toBeNull()
    expect(mockedDevice.modelName).toBeNull()
    const isAndroidCheck =
      mockedPlatform.OS === 'android' ||
      (mockedDevice.osName ?? '').toLowerCase().includes('android')
    const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A)'
    const uaMatchesVendor = __unsafeMatchesHighRiskVendor(ua)
    expect(ua.toLowerCase().includes('moto')).toBe(false)
    expect(ua.toLowerCase().includes('vivo')).toBe(false)
    const isHighRisk = isHighRiskPasskeyEnvironment(ua)
    const decision = await evaluatePasskeyDiagnostic('high-risk', ua)

    expect(isAndroidCheck).toBe(false)
    expect(uaMatchesVendor).toBe(false)
    expect(isHighRisk).toBe(false)
    expect(decision).toEqual({ shouldRun: true, reason: 'web-platform-authenticator-missing' })
    expect(__unsafeGetWebPlatformSupportCache()).toBe('missing')
    expect(uvpaa).toHaveBeenCalled()
  })

  it('skips when web UVPAA reports support', async () => {
    mockedPlatform.OS = 'web'
    mockedDevice.osName = 'web'
    const { mock, uvpaa } = createPublicKeyCredentialMock(true)
    setPublicKeyCredential(mock)

    expect(mockedPlatform.OS).toBe('web')
    expect(mockedDevice.osName).toBe('web')
    expect(mockedDevice.brand).toBeNull()
    expect(mockedDevice.manufacturer).toBeNull()
    expect(mockedDevice.modelName).toBeNull()
    const isAndroidCheck =
      mockedPlatform.OS === 'android' ||
      (mockedDevice.osName ?? '').toLowerCase().includes('android')
    const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A)'
    const uaMatchesVendor = __unsafeMatchesHighRiskVendor(ua)
    expect(ua.toLowerCase().includes('moto')).toBe(false)
    expect(ua.toLowerCase().includes('vivo')).toBe(false)
    const isHighRisk = isHighRiskPasskeyEnvironment(ua)
    const decision = await evaluatePasskeyDiagnostic('high-risk', ua)

    expect(isAndroidCheck).toBe(false)
    expect(uaMatchesVendor).toBe(false)
    expect(isHighRisk).toBe(false)
    expect(decision).toEqual({ shouldRun: false, reason: 'web-platform-authenticator-present' })
    expect(__unsafeGetWebPlatformSupportCache()).toBe('supported')
    expect(uvpaa).toHaveBeenCalled()
  })
})

describe('PasskeyDiagnosticError', () => {
  it('exposes the standard message', () => {
    expect(PASSKEY_DIAGNOSTIC_ERROR_MESSAGE).toContain('Passkey health check failed')
  })
})

describe('diagnostic logging', () => {
  it('logs lifecycle when enabled', async () => {
    process.env.NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_LOGGING = 'enabled'
    const logSpy = jest.fn()
    __unsafeSetPasskeyDiagnosticLogger(logSpy as unknown as Debugger)

    mockedSignChallenge.mockResolvedValue({
      accountName: 'user-id',
      keySlot: 0,
      encodedWebAuthnSig: '0x',
    })

    const result = await runPasskeyDiagnostic({
      allowedCredentials: [{ id: 'credential', userHandle: 'user-id.0' }],
    })

    expect(result.success).toBe(true)
    expect(logSpy).toHaveBeenCalledWith(
      'run-start',
      expect.objectContaining({ credentialCount: 1 })
    )
    expect(logSpy).toHaveBeenCalledWith(
      'run-success',
      expect.objectContaining({ credentialCount: 1 })
    )

    __unsafeResetPasskeyDiagnosticLogger()
  })
})
