import { useRef } from 'react'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { base16, base64urlnopad } from '@scure/base'
import { asciiToByteArray } from 'app/utils/asciiToByteArray'
import { createPasskey } from 'app/utils/createPasskey'
import type { ParsedCredAuthData } from 'app/utils/passkeys'
import type { RegistrationResponseJSON } from 'react-native-passkeys/build/ReactNativePasskeys.types'
import type { User } from '@supabase/supabase-js'
import { base64URLNoPadToBase16 } from 'app/utils/base64ToBase16'
import { api } from 'app/utils/api'
import {
  PASSKEY_DIAGNOSTIC_ERROR_MESSAGE,
  getPasskeyDiagnosticMode,
  runPasskeyDiagnostic,
  shouldRunPasskeyDiagnostic,
} from 'app/utils/passkeyDiagnostic'

type SendAccountData = Awaited<ReturnType<typeof useSendAccount>['refetch']>['data']

export const useCreateSendAccount = () => {
  const sendAccount = useSendAccount()
  const { mutateAsync: sendAccountCreateMutateAsync } = api.sendAccount.create.useMutation()
  const credentialRef = useRef<{
    rawCred: RegistrationResponseJSON
    authData: ParsedCredAuthData
    passkeyName: string
  } | null>(null)

  const createSendAccount = async ({
    accountName,
    user,
    passkeyDiagnosticCallbacks,
  }: {
    user: User
    accountName: string
    passkeyDiagnosticCallbacks?: {
      onStart?: () => void
      onSuccess?: () => void
      onFailure?: (cause: unknown) => void
    }
  }): Promise<SendAccountData> => {
    const { data: alreadyCreatedSendAccount, error: errorCheckingAlreadyCreatedSendAccount } =
      await sendAccount.refetch()
    if (errorCheckingAlreadyCreatedSendAccount) throw errorCheckingAlreadyCreatedSendAccount
    if (alreadyCreatedSendAccount) {
      throw new Error(`Account already created: ${alreadyCreatedSendAccount.address}`)
    }

    const keySlot = 0
    const passkeyName = `${user.id}.${keySlot}` // 64 bytes max

    if (!credentialRef.current || credentialRef.current.passkeyName !== passkeyName) {
      const challenge = base64urlnopad.encode(asciiToByteArray('foobar'))
      const [rawCred, authData] = await createPasskey({
        user,
        keySlot,
        challenge,
        accountName,
      })
      credentialRef.current = {
        rawCred,
        authData,
        passkeyName,
      }
    }

    const { rawCred, authData } = credentialRef.current!

    const diagnosticMode = getPasskeyDiagnosticMode()
    if (await shouldRunPasskeyDiagnostic(diagnosticMode)) {
      passkeyDiagnosticCallbacks?.onStart?.()
      const diagnosticResult = await runPasskeyDiagnostic({
        allowedCredentials: [
          {
            id: rawCred.rawId,
            userHandle: passkeyName,
          },
        ],
      })

      if (!diagnosticResult.success) {
        passkeyDiagnosticCallbacks?.onFailure?.(diagnosticResult.cause)
        return null as SendAccountData
      }

      passkeyDiagnosticCallbacks?.onSuccess?.()
    }

    const raw_credential_id = base64URLNoPadToBase16(rawCred.rawId)
    const attestation_object = base64URLNoPadToBase16(rawCred.response.attestationObject)

    await sendAccountCreateMutateAsync({
      accountName,
      passkeyName,
      rawCredentialIDB16: raw_credential_id,
      cosePublicKeyB16: base16.encode(authData.COSEPublicKey),
      rawAttestationObjectB16: attestation_object,
      keySlot,
    })

    const { data: createdSendAccount, error: creatingSendAccountError } =
      await sendAccount.refetch()

    if (creatingSendAccountError) throw creatingSendAccountError
    if (createdSendAccount) {
      credentialRef.current = null
      return createdSendAccount
    }

    throw new Error('Account not created. Please try again.')
  }

  return {
    createSendAccount,
  }
}
