import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals'

import {
  PASSKEY_DIAGNOSTIC_ERROR_MESSAGE,
  runPasskeyDiagnostic,
  shouldRunPasskeyDiagnostic,
  __unsafeResetPasskeyDiagnosticCache,
  __unsafeGetWebPlatformSupportCache,
  isHighRiskPasskeyEnvironment,
  __unsafeMatchesHighRiskVendor,
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
const mockedPlatform = jest.requireMock('react-native').Platform as { OS: string }
const mockedDevice = jest.requireMock('expo-device') as {
  brand: string | null
  manufacturer: string | null
  modelName: string | null
  osName: string | null
}
const mockedHasGmsSync = jest.requireMock('react-native-device-info')
  .hasGmsSync as jest.MockedFunction<() => boolean>

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
  const uvpaa = jest.fn().mockResolvedValue(hasSupport)
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
    const result = await shouldRunPasskeyDiagnostic('always')
    expect(result).toBe(true)
  })

  it('runs in high-risk mode when user agent matches', async () => {
    const result = await shouldRunPasskeyDiagnostic(
      'high-risk',
      'Mozilla/5.0 (Linux; Android 13; vivo X90 Build/TP1A)'
    )
    expect(result).toBe(true)
  })

  it('runs in high-risk mode when vendor fingerprint matches expanded OEM list', async () => {
    mockedDevice.brand = 'Realme'
    const result = await shouldRunPasskeyDiagnostic('high-risk')
    expect(result).toBe(true)
  })

  it('skips when vendor matches but Google Mobile Services is available', async () => {
    mockedDevice.brand = 'Vivo'
    mockedHasGmsSync.mockReturnValue(true)
    const result = await shouldRunPasskeyDiagnostic('high-risk')
    expect(result).toBe(false)
  })

  it('runs in high-risk mode when android vendor is unknown', async () => {
    mockedPlatform.OS = 'android'
    mockedDevice.osName = 'Android'
    mockedDevice.brand = null
    mockedDevice.manufacturer = null
    mockedDevice.modelName = null
    const result = await shouldRunPasskeyDiagnostic('high-risk')
    expect(result).toBe(true)
  })

  it('runs in high-risk mode when device brand matches', async () => {
    mockedDevice.brand = 'Vivo'
    const result = await shouldRunPasskeyDiagnostic('high-risk')
    expect(result).toBe(true)
  })

  it('runs in high-risk mode when user agent is a placeholder', async () => {
    mockedPlatform.OS = 'android'
    mockedDevice.osName = 'Android'
    mockedDevice.brand = null
    mockedDevice.manufacturer = null
    mockedDevice.modelName = null
    const result = await shouldRunPasskeyDiagnostic('high-risk', 'reactnative')
    expect(result).toBe(true)
  })

  it('skips in high-risk mode for safe user agent', async () => {
    mockedPlatform.OS = 'ios'
    mockedDevice.osName = 'iOS'
    const result = await shouldRunPasskeyDiagnostic(
      'high-risk',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    )
    expect(result).toBe(false)
  })

  it('skips when disabled', async () => {
    const result = await shouldRunPasskeyDiagnostic(
      'disabled',
      'Mozilla/5.0 (Linux; Android 13; vivo X90 Build/TP1A)'
    )
    expect(result).toBe(false)
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
    const result = await shouldRunPasskeyDiagnostic('high-risk', ua)

    expect(isAndroidCheck).toBe(false)
    expect(uaMatchesVendor).toBe(false)
    expect(isHighRisk).toBe(false)
    expect(result).toBe(true)
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
    const result = await shouldRunPasskeyDiagnostic('high-risk', ua)

    expect(isAndroidCheck).toBe(false)
    expect(uaMatchesVendor).toBe(false)
    expect(isHighRisk).toBe(false)
    expect(result).toBe(false)
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
    const logSpy = jest.spyOn(console, 'info').mockImplementation(() => {})

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
      '[passkey-diagnostic]',
      'run-start',
      expect.objectContaining({ credentialCount: 1 })
    )
    expect(logSpy).toHaveBeenCalledWith(
      '[passkey-diagnostic]',
      'run-success',
      expect.objectContaining({ credentialCount: 1 })
    )

    logSpy.mockRestore()
  })
})
