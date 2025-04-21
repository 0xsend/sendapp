import { base64urlnopad } from '@scure/base'
import { assert } from 'app/utils/assert'
import { type ParsedCredAuthData, parseCreateResponse } from 'app/utils/passkeys'
import { applicationId } from 'expo-application'
import { Platform } from 'react-native'
import { create, isSupported } from 'react-native-passkeys'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from 'react-native-passkeys/build/ReactNativePasskeys.types'

export async function createPasskey({
  user,
  keySlot,
  challenge,
  accountName,
}: { user: { id: string }; keySlot: number; challenge: string; accountName: string }): Promise<
  [RegistrationResponseJSON, ParsedCredAuthData]
> {
  if (!isSupported()) {
    throw new Error('Passkeys not supported')
  }

  return await create(
    createSendAccountPasskeyArgs({
      user,
      keySlot,
      challenge,
      accountName,
    })
  )
    .catch((e) => {
      if (e.message.includes(`Calling the 'create' function has failed\n→ Caused by: `)) {
        throw new Error(
          e.message.replace(`Calling the 'create' function has failed\n→ Caused by: `, '')
        )
      }
      throw e
    })
    .then((r) => {
      assert(!!r, 'Failed to create passkey')
      return [r, parseCreateResponse(r)] as const
    })
}

export function createSendAccountPasskeyArgs({
  user,
  keySlot,
  challenge,
  accountName,
}: {
  user: { id: string }
  keySlot: number
  challenge: Base64URLString // base64urlnopad encoded
  accountName: string
}): PublicKeyCredentialCreationOptionsJSON {
  const passkeyName = `${user.id}.${keySlot}` // 64 bytes max
  const id = base64urlnopad.encode(Buffer.from(passkeyName))
  return {
    challenge,
    user: {
      id,
      name: `Send App: ${accountName}`,
      displayName: `Send App: ${accountName}`,
    },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    rp: {
      name: 'Send App',
      id: rpId,
    },
    authenticatorSelection: {
      userVerification: 'required',
      residentKey: 'required',
    },
    attestation: undefined,
  } as const satisfies PublicKeyCredentialCreationOptionsJSON
}

const bundleId = applicationId?.split('.').reverse().join('.')
export const rpId = Platform.select({
  web: undefined,
  ios: bundleId,
  android: bundleId?.replaceAll('_', '-'),
})
