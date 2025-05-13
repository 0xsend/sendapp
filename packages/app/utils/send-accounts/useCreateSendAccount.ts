import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { base16, base64urlnopad } from '@scure/base'
import { asciiToByteArray } from 'app/utils/asciiToByteArray'
import { createPasskey } from 'app/utils/createPasskey'
import type { User } from '@supabase/supabase-js'
import { base64URLNoPadToBase16 } from 'app/utils/base64ToBase16'
import { api } from 'app/utils/api'

export const useCreateSendAccount = () => {
  const sendAccount = useSendAccount()
  const { mutateAsync: sendAccountCreateMutateAsync } = api.sendAccount.create.useMutation()

  const createSendAccount = async ({ accountName, user }: { user: User; accountName: string }) => {
    const { data: alreadyCreatedSendAccount, error: errorCheckingAlreadyCreatedSendAccount } =
      await sendAccount.refetch()
    if (errorCheckingAlreadyCreatedSendAccount) throw errorCheckingAlreadyCreatedSendAccount
    if (alreadyCreatedSendAccount) {
      throw new Error(`Account already created: ${alreadyCreatedSendAccount.address}`)
    }

    const keySlot = 0
    const passkeyName = `${user.id}.${keySlot}` // 64 bytes max
    const challenge = base64urlnopad.encode(asciiToByteArray('foobar'))

    const [rawCred, authData] = await createPasskey({
      user,
      keySlot,
      challenge,
      accountName,
    })

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
      return createdSendAccount
    }

    throw new Error('Account not created. Please try again.')
  }

  return {
    createSendAccount,
  }
}
