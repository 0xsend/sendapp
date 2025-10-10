# Passkey Diagnostics

Send can optionally run a "passkey health check" immediately after provisioning a new credential (or before other
critical actions). This feature helps catch OEMs with broken WebAuthn implementations before a user deposits funds.

## Feature Flag

The behaviour is controlled with the `NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_MODE` environment variable:

- `disabled` *(default)* – diagnostics never run.
- `high-risk` – diagnostics run on devices whose user agent or device metadata indicates Android builds from
  manufacturers with known WebAuthn bugs (Vivo, Oppo/OnePlus/Realme, Xiaomi/Redmi/Poco, Huawei/Honor, ZTE/Nubia,
  Meizu, Lenovo/Motorola, Tecno/Infinix) or placeholder Android builds that hide the vendor.
- `always` – diagnostics run for every device.

### Logging control

- `NEXT_PUBLIC_PASSKEY_DIAGNOSTIC_LOGGING` – set to `enabled` to emit structured console logs describing the
  environment signals (user agent, vendor fingerprint, heuristic matches) and the diagnostic lifecycle. Leave unset in
  production unless debugging.

Devices that identify as high-risk vendors but report Google Mobile Services (GMS) availability are automatically
treated as healthy and skip the diagnostic—global-market firmware from those OEMs usually ships with GMS.

On the web/PWA surface we additionally probe
`PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` (UVPAA). If the browser reports that no
platform authenticator is available, the app still invokes the dummy-sign diagnostic after onboarding to confirm the
device can safely sign transactions.

## Usage

The helper `runPasskeyDiagnostic` wraps the existing `signChallenge` flow with a throwaway challenge. Any failure is
reported with a `PasskeyDiagnosticError`, allowing flows to block onboarding or deposits until a healthy signer is
present. During onboarding, the app surfaces a “passkey integrity check” status indicator with friendly messaging,
including explicit retry affordances when the check fails, so the user understands why the extra biometric prompt
appears.

```
import { runPasskeyDiagnostic, shouldRunPasskeyDiagnostic, getPasskeyDiagnosticMode } from 'app/utils/passkeyDiagnostic'

const mode = getPasskeyDiagnosticMode()
if (await shouldRunPasskeyDiagnostic(mode)) {
  const result = await runPasskeyDiagnostic({
    allowedCredentials: [{ id: credentialId, userHandle: passkeyName }],
  })

  if (!result.success) {
    throw new PasskeyDiagnosticError('Passkey health check failed', { cause: result.cause })
  }
}
```

The same helper can be reused outside onboarding (e.g., before the first deposit or when adding backup signers) by
passing the appropriate `allowedCredentials` array.
