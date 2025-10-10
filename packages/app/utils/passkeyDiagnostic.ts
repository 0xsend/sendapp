import * as Device from 'expo-device'
import { Platform } from 'react-native'
import type { Hex } from 'viem'

import { signChallenge } from './signChallenge'

const PASSKEY_DIAGNOSTIC_CHALLENGE: Hex = `0x${'00'.repeat(32)}`

export const PASSKEY_DIAGNOSTIC_ERROR_MESSAGE =
  'Passkey health check failed. Try creating your passkey on a device with iCloud Keychain or Google Password Manager.'

export const PASSKEY_DIAGNOSTIC_TOAST_MESSAGE = 'Passkey integrity check failed.'

export type PasskeyDiagnosticMode = 'disabled' | 'always' | 'high-risk'

export type PasskeyDiagnosticResult = { success: true } | { success: false; cause: unknown }

export class PasskeyDiagnosticError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'PasskeyDiagnosticError'
    if (options?.cause) {
      this.cause = options.cause
    }
  }
}

export function getPasskeyDiagnosticMode(): PasskeyDiagnosticMode {
  const raw = (process.env.NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_MODE ?? 'disabled').toLowerCase()
  if (raw === 'always') return 'always'
  if (raw === 'high-risk' || raw === 'highrisk') return 'high-risk'
  return 'disabled'
}

function normalize(value?: string | null): string {
  return value?.toLowerCase() ?? ''
}

const HIGH_RISK_ANDROID_VENDORS = [
  'vivo',
  'iqoo',
  'oppo',
  'realme',
  'oneplus',
  'xiaomi',
  'redmi',
  'poco',
  'miui',
  'huawei',
  'honor',
  'harmonyos',
  'zte',
  'nubia',
  'meizu',
  'lenovo',
  'moto',
  'motorola',
  'tecno',
  'infinix',
  'funtouch',
  'coloros',
  'oxygenos',
  'originos',
]

function matchesHighRiskVendor(value: string): boolean {
  return HIGH_RISK_ANDROID_VENDORS.some((vendor) => value.includes(vendor))
}

type DeviceInfoModule = {
  hasGmsSync?: () => boolean
}

type WebPlatformSupport = 'supported' | 'missing' | 'unknown'

let cachedHasGms: boolean | null | undefined
let cachedWebPlatformSupport: WebPlatformSupport | undefined
let cachedWebPlatformSupportPromise: Promise<WebPlatformSupport> | null = null

function deviceHasGoogleMobileServices(): boolean | null {
  if (cachedHasGms !== undefined) {
    return cachedHasGms
  }

  if (Platform.OS !== 'android') {
    cachedHasGms = null
    return cachedHasGms
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const deviceInfo: DeviceInfoModule = require('react-native-device-info')
    if (typeof deviceInfo.hasGmsSync === 'function') {
      cachedHasGms = deviceInfo.hasGmsSync()
      return cachedHasGms
    }
  } catch (error) {
    logPasskeyDiagnostic('environment-gms-check-failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  cachedHasGms = null
  return cachedHasGms
}

async function detectWebPlatformAuthenticatorSupport(): Promise<WebPlatformSupport> {
  if (Platform.OS !== 'web') {
    return 'unknown'
  }

  if (cachedWebPlatformSupport !== undefined) {
    return cachedWebPlatformSupport
  }

  if (cachedWebPlatformSupportPromise) {
    return cachedWebPlatformSupportPromise
  }

  cachedWebPlatformSupportPromise = (async () => {
    const scope =
      typeof globalThis !== 'undefined'
        ? (globalThis as typeof globalThis)
        : ({} as typeof globalThis)
    const uvpaa = scope.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable

    if (typeof uvpaa !== 'function') {
      cachedWebPlatformSupport = 'unknown'
      return cachedWebPlatformSupport
    }

    try {
      const hasPlatformAuthenticator = await uvpaa()
      cachedWebPlatformSupport = hasPlatformAuthenticator ? 'supported' : 'missing'

      if (!hasPlatformAuthenticator) {
        logPasskeyDiagnostic('web-uvpaa-missing', {})
      } else {
        logPasskeyDiagnostic('web-uvpaa-supported', {})
      }

      return cachedWebPlatformSupport
    } catch (error) {
      logPasskeyDiagnostic('web-uvpaa-error', {
        error: error instanceof Error ? error.message : String(error),
      })
      cachedWebPlatformSupport = 'unknown'
      return cachedWebPlatformSupport
    } finally {
      cachedWebPlatformSupportPromise = null
    }
  })()

  const result = await cachedWebPlatformSupportPromise
  cachedWebPlatformSupportPromise = null
  return result
}

function isDiagnosticLoggingEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_LOGGING ?? '').toLowerCase() === 'enabled'
}

function logPasskeyDiagnostic(event: string, details: Record<string, unknown>) {
  if (!isDiagnosticLoggingEnabled()) return
  console.info('[passkey-diagnostic]', event, details)
}

export function isHighRiskPasskeyEnvironment(userAgent?: string): boolean {
  const ua = normalize(userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : ''))

  const deviceBrand = normalize(Device.brand)
  const deviceManufacturer = normalize((Device as { manufacturer?: string | null }).manufacturer)
  const deviceModel = normalize(Device.modelName)
  const deviceOsName = normalize(Device.osName)

  const vendorFingerprint = `${deviceBrand} ${deviceManufacturer} ${deviceModel}`.trim()
  const hasGms = deviceHasGoogleMobileServices()

  const isNativeIos = Platform.OS === 'ios' || deviceOsName === 'ios'
  if (isNativeIos) {
    logPasskeyDiagnostic('environment-native-ios', {
      userAgent: ua,
      vendorFingerprint,
    })
    return false
  }

  const matchesUaVendor = matchesHighRiskVendor(ua)
  const matchesFingerprintVendor = vendorFingerprint
    ? matchesHighRiskVendor(vendorFingerprint)
    : false

  if (matchesUaVendor || matchesFingerprintVendor) {
    if (hasGms === true) {
      logPasskeyDiagnostic('environment-gms-present', {
        userAgent: ua,
        vendorFingerprint,
      })
      return false
    }

    logPasskeyDiagnostic('environment-high-risk', {
      userAgent: ua,
      vendorFingerprint,
      matchesUaVendor,
      matchesFingerprintVendor,
      hasGms,
    })
    return true
  }

  if (Platform.OS === 'web') {
    return false
  }

  const isAndroid = Platform.OS === 'android' || deviceOsName.includes('android')

  // Certain custom Android builds surface placeholder user agents like "reactnative" or expose no OEM hints.
  const looksLikePlaceholderUa = ua === 'reactnative' || ua === 'react-native'
  const hasVendorSignal = !!vendorFingerprint
  const highRiskByMissingSignals = isAndroid && (!hasVendorSignal || looksLikePlaceholderUa)

  logPasskeyDiagnostic('environment-evaluated', {
    userAgent: ua,
    vendorFingerprint,
    isAndroid,
    hasVendorSignal,
    looksLikePlaceholderUa,
    highRiskByMissingSignals,
    hasGms,
  })

  if (highRiskByMissingSignals && hasGms !== true) {
    return true
  }

  return false
}

export async function shouldRunPasskeyDiagnostic(
  mode: PasskeyDiagnosticMode,
  userAgent?: string
): Promise<boolean> {
  switch (mode) {
    case 'always':
      return true
    case 'high-risk':
      break
    default:
      return false
  }

  const highRiskEnvironment = isHighRiskPasskeyEnvironment(userAgent)
  if (highRiskEnvironment) {
    return true
  }

  const webPlatformSupport = await detectWebPlatformAuthenticatorSupport()
  if (webPlatformSupport === 'missing') {
    return true
  }

  return false
}

export async function runPasskeyDiagnostic({
  allowedCredentials,
  challengeHex = PASSKEY_DIAGNOSTIC_CHALLENGE,
}: {
  allowedCredentials: { id: string; userHandle: string }[]
  challengeHex?: Hex
}): Promise<PasskeyDiagnosticResult> {
  if (allowedCredentials.length === 0) {
    const error = new Error('No passkey credentials available for diagnostics')
    logPasskeyDiagnostic('run-missing-credentials', { error: error.message })
    return { success: false, cause: error }
  }

  try {
    logPasskeyDiagnostic('run-start', {
      credentialCount: allowedCredentials.length,
    })
    await signChallenge(challengeHex, allowedCredentials)
    logPasskeyDiagnostic('run-success', {
      credentialCount: allowedCredentials.length,
    })
    return { success: true }
  } catch (error) {
    logPasskeyDiagnostic('run-failure', {
      credentialCount: allowedCredentials.length,
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, cause: error }
  }
}

/**
 * Test-only helper used to clear memoized device signals.
 */
export function __unsafeResetPasskeyDiagnosticCache() {
  cachedHasGms = undefined
  cachedWebPlatformSupport = undefined
  cachedWebPlatformSupportPromise = null
}

export function __unsafeGetWebPlatformSupportCache(): WebPlatformSupport | undefined {
  return cachedWebPlatformSupport
}

export const __unsafeHighRiskVendors = HIGH_RISK_ANDROID_VENDORS

export function __unsafeMatchesHighRiskVendor(value: string): boolean {
  return matchesHighRiskVendor(normalize(value))
}
