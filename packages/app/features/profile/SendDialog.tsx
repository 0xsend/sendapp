import {
  Adapt,
  Button,
  Container,
  Dialog,
  DialogProps,
  Paragraph,
  Sheet,
  SizableText,
  SubmitButton,
  XStack,
  YStack,
  useToastController,
} from '@my/ui'
import { IconClose } from 'app/components/icons'
import { AvatarProfile } from './AvatarProfile'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { z } from 'zod'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { useSendAccounts } from 'app/utils/useSendAccounts'
import { base16 } from '@scure/base'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
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
import { iEntryPointABI } from '@my/wagmi'
import { baseMainnetBundlerClient as bundlerClient, baseMainnetClient } from 'app/utils/viem/client'
import { assert } from 'app/utils/assert'
import { Provider } from 'app/provider'
import { useState } from 'react'

type ProfileProp = NonNullable<ReturnType<typeof useProfileLookup>['data']>

export function SendDialog({ profile, ...props }: DialogProps & { profile: ProfileProp }) {
  return (
    <Dialog modal {...props}>
      <Adapt when="sm" platform="touch">
        <Sheet animation="medium" zIndex={200000} modal snapPoints={[100]}>
          <Sheet.Frame p={'$5'} backgroundColor={'$background'} jc={'center'}>
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            opacity={0.7}
          />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          px={'$7'}
          fullscreen
        >
          <Container>
            <YStack f={1} gap="$5">
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap="$2">
                  <Dialog.Title>Send</Dialog.Title>
                </XStack>
                <Dialog.Close asChild displayWhenAdapted>
                  <Button size="$2.5" circular bg={'unset'}>
                    <IconClose opacity={0.5} />
                  </Button>
                </Dialog.Close>
              </XStack>
              <Dialog.Description>
                <XStack ai="center" gap="$5">
                  <AvatarProfile profile={profile} />
                  <SizableText fontWeight="bold">{profile.name}</SizableText>
                </XStack>
              </Dialog.Description>
              <Provider>
                <SendForm profile={profile} />
              </Provider>
            </YStack>
          </Container>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

const SendFormSchema = z.object({
  address: z.string().describe('Address'),
  chainId: z.number().describe('Chain ID'), // @todo use bigint
  amount: formFields.number.describe('Amount'), // @todo use bigint
})

function SendForm({ profile }: { profile: ProfileProp }) {
  const toast = useToastController()
  const form = useForm<z.infer<typeof SendFormSchema>>()
  const { data: sendAccts } = useSendAccounts()
  const sendAcct = sendAccts?.[0]
  const webauthnCred = sendAcct?.webauthn_credentials?.[0]
  const [sentUserOpHash, setSentUserOpHash] = useState<Hex>()

  // @todo split this method up
  // @todo move to utils
  async function genSignAndSendUserOp(data: z.infer<typeof SendFormSchema>) {
    assert(!!sendAcct, 'No send account')
    assert(!!webauthnCred, 'No send account credentials')

    const publicKey = COSEECDHAtoXY(base16.decode(webauthnCred.public_key.slice(2).toUpperCase()))
    assert(!!publicKey, 'No publicKey')

    const { userOp, userOpHash } = await generateUserOp(publicKey)
    const challenge = generateChallenge(userOpHash)
    assert(!!challenge?.length, 'No challenge')
    assert(!!userOpHash, 'No userOpHash')

    const encodedWebAuthnSig = await signChallenge(challenge)

    const signature = concat([
      numberToBytes(USEROP_VERSION, { size: 1 }), // @todo add userop version to send account and use that
      numberToBytes(USEROP_VALID_UNTIL, { size: 6 }), // @todo use smaller validUntil
      numberToBytes(USEROP_KEY_SLOT, { size: 1 }), // @todo use key slot based on webauthnCred
      hexToBytes(encodedWebAuthnSig),
    ])
    assert(
      await verifySignature(challenge, bytesToHex(signature.slice(7)), publicKey),
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
        defaultValues={{
          address: profile.address,
          chainId: profile.chain_id,
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
      abi: iEntryPointABI,
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
      abi: iEntryPointABI,
      args: [
        _userOp,
        '0x0000000000000000000000000000000000000000', // target address TODO: optionally return target address result
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
