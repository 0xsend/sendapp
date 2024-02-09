import { Button, Paragraph, SubmitButton, useToastController } from '@my/ui'
import { z } from 'zod'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { useSendAccounts } from 'app/utils/send-accounts'
import {
  generateUserOp,
  generateChallenge,
  signChallenge,
  USEROP_VERSION,
  USEROP_VALID_UNTIL,
  USEROP_KEY_SLOT,
  entrypoint,
  testClient as testBaseClient,
  verifySignature,
} from 'app/utils/userop'
import { UserOperation } from 'permissionless'
import {
  Hex,
  concat,
  numberToBytes,
  hexToBytes,
  bytesToHex,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  parseEther,
} from 'viem'
import { iEntryPointAbi, usdcAddress as usdcAddresses } from '@my/wagmi'
import { baseMainnetBundlerClient as bundlerClient, baseMainnetClient } from '@my/wagmi'
import { assert } from 'app/utils/assert'
import { useState } from 'react'
import { webauthnCredToXY } from 'app/utils/webauthn-creds'
import { ProfileProp } from './SendDialog'
import { useBalance, useChainId } from 'wagmi'

// @todo add currency field
const SendFormSchema = z.object({
  amount: formFields.number.describe('Amount'),
  token: formFields.select.describe('Token').optional(),
})

export function SendForm({ profile }: { profile: ProfileProp }) {
  const chainId = useChainId()
  const toast = useToastController()
  const form = useForm<z.infer<typeof SendFormSchema>>()
  const { data: sendAccts } = useSendAccounts()
  const sendAcct = sendAccts?.[0]
  const webauthnCred = sendAcct?.webauthn_credentials?.[0]
  const [sentUserOpHash, setSentUserOpHash] = useState<Hex>()
  const token = form.watch('token') as `0x${string}` | undefined
  const balance = useBalance({ address: sendAcct?.address, token, query: { enabled: !!sendAcct } })

  // @todo split this method up
  // @todo move to utils
  async function genSignAndSendUserOp({ amount }: z.infer<typeof SendFormSchema>) {
    const { address, chain_id } = profile
    assert(!!address, 'No address')
    assert(!!chain_id, 'No chain_id')
    assert(!!sendAcct, 'No send account')
    assert(!!webauthnCred, 'No send account credentials')

    const pubKeyXY = webauthnCredToXY(webauthnCred)

    const { userOp, userOpHash } = await generateUserOp(pubKeyXY)
    const challenge = generateChallenge(userOpHash)
    assert(!!challenge?.length, 'No challenge')
    assert(!!userOpHash, 'No userOpHash')

    const encodedWebAuthnSig = await signChallenge(challenge)

    const signature = concat([
      numberToBytes(USEROP_VERSION, { size: 1 }),
      numberToBytes(USEROP_VALID_UNTIL, { size: 6 }),
      numberToBytes(USEROP_KEY_SLOT, { size: 1 }),
      hexToBytes(encodedWebAuthnSig),
    ])
    assert(
      await verifySignature(challenge, bytesToHex(signature.slice(7)), pubKeyXY),
      'Signature invalid'
    )

    assert(await sendUserOp({ userOp, signature }), 'Failed to send userOp')
    return { userOp, userOpHash }
  }

  async function onSubmit(data: z.infer<typeof SendFormSchema>) {
    try {
      const { userOpHash } = await genSignAndSendUserOp(data)
      setSentUserOpHash(userOpHash)
      toast.show(`Sent user op ${userOpHash}!`)
    } catch (e) {
      console.error(e)
      toast.show('Failed to send user op')
      form.setError('amount', { type: 'custom', message: `Failed to send user op: ${e}` })
    }
  }

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        schema={SendFormSchema}
        onSubmit={onSubmit}
        props={{
          token: {
            options: [
              { name: 'ETH', value: '' },
              { name: 'USDC', value: usdcAddresses[chainId] },
            ],
          },
        }}
        renderAfter={({ submit }) =>
          sentUserOpHash ? (
            <Paragraph>Sent user op: {sentUserOpHash}</Paragraph>
          ) : (
            <SubmitButton onPress={submit}>
              <Button.Text>Send</Button.Text>
            </SubmitButton>
          )
        }
      />
    </FormProvider>
  )
}

async function sendUserOp({
  userOp,
  signature,
}: {
  userOp: UserOperation
  signature: Uint8Array
}): Promise<boolean> {
  const _userOp: UserOperation = {
    ...userOp,
    signature: bytesToHex(signature),
  }

  if (__DEV__) {
    console.log('Funding sending address', _userOp.sender)
    await testBaseClient.setBalance({
      address: _userOp.sender,
      value: parseEther('1'),
    })
  }

  // [simulateValidation](https://github.com/eth-infinitism/account-abstraction/blob/187613b0172c3a21cf3496e12cdfa24af04fb510/contracts/interfaces/IEntryPoint.sol#L152)
  await baseMainnetClient
    .simulateContract({
      address: entrypoint.address,
      functionName: 'simulateValidation',
      abi: iEntryPointAbi,
      args: [_userOp],
    })
    .catch((e: ContractFunctionExecutionError) => {
      const cause: ContractFunctionRevertedError = e.cause
      if (cause.data?.errorName === 'ValidationResult') {
        const data = cause.data
        if ((data.args?.[0] as { sigFailed: boolean }).sigFailed) {
          throw new Error('Signature failed')
        }
        // console.log('ValidationResult', data)
        return data
      }
      throw e
    })

  // [simulateHandleOp](https://github.com/eth-infinitism/account-abstraction/blob/187613b0172c3a21cf3496e12cdfa24af04fb510/contracts/interfaces/IEntryPoint.sol#L203)
  await baseMainnetClient
    .simulateContract({
      address: entrypoint.address,
      functionName: 'simulateHandleOp',
      abi: iEntryPointAbi,
      args: [
        _userOp,
        '0x0000000000000000000000000000000000000000',
        '0x', // target calldata
      ],
    })
    .catch((e: ContractFunctionExecutionError) => {
      const cause: ContractFunctionRevertedError = e.cause
      if (cause.data?.errorName === 'ExecutionResult') {
        const data = cause.data
        if ((data.args?.[0] as { success: boolean }).success) {
          throw new Error('Handle op failed')
        }
        // console.log('ExecutionResult', data)
        // TODO: use to estimate gas
        return data
      }
      throw e
    })

  const hash = await bundlerClient.sendUserOperation({
    userOperation: _userOp,
    entryPoint: entrypoint.address,
  })
  const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })
  if (receipt.success !== true) {
    throw new Error('Failed to send userOp')
  }
  return receipt.success
}
