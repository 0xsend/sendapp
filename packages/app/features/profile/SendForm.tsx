import { Button, Paragraph, Spinner, SubmitButton, useToastController } from '@my/ui'
import { z } from 'zod'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { useSendAccounts } from 'app/utils/send-accounts'
import { Hex, formatUnits, parseUnits, isAddress, isHex } from 'viem'
import { baseMainnet, usdcAddress as usdcAddresses } from '@my/wagmi'
import { useState } from 'react'
import { ProfileProp } from './SendDialog'
import { useBalance, useChainId, useTransactionCount } from 'wagmi'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccountInitCode } from 'app/utils/useSendAccountInitCode'
import { useUserOpTransferMutation } from 'app/utils/useUserOpTransferMutation'
import { assert } from 'app/utils/assert'

// @todo add currency field
const SendFormSchema = z.object({
  amount: formFields.text.describe('Amount'),
  token: formFields.select.describe('Token'),
})

export function SendForm({ profile }: { profile: ProfileProp }) {
  const chainId = useChainId()
  const toast = useToastController()
  const form = useForm<z.infer<typeof SendFormSchema>>()
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]
  const webauthnCred = sendAccount?.webauthn_credentials?.[0]
  const [sentUserOpHash, setSentUserOpHash] = useState<Hex>()
  const token = form.watch('token') as `0x${string}` | undefined
  const {
    data: balance,
    isPending: balanceIsPending,
    refetch: balanceRefetch,
  } = useBalance({
    address: sendAccount?.address,
    token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  // need init code in case this is a new account
  const {
    data: initCode,
    isSuccess: initCodeIsSuccess,
    error: initCodeError,
  } = useSendAccountInitCode({ sendAccount })
  // need nonce to send transaction
  const {
    data: nonce,
    isSuccess: nonceIsSuccess,
    error: nonceError,
  } = useTransactionCount({
    address: sendAccount?.address,
    query: { enabled: !!sendAccount?.address },
    chainId: baseMainnet.id,
  })

  const {
    mutateAsync: sendUserOp,
    isPending: isSendUserOpPending,
    isError: isSendUserOpError,
    error: sendUserOpError,
    data: sendUserOpData,
  } = useUserOpTransferMutation()
  async function onSubmit({ token, amount: amountStr }: z.infer<typeof SendFormSchema>) {
    try {
      assert(!!balance, 'Balance is not available')
      assert(initCodeError === null, `Failed to get init code: ${initCodeError}`)
      assert(isHex(initCode), 'Init code is not available')
      assert(nonceError === null, `Failed to get nonce: ${nonceError}`)
      assert(nonce !== undefined, 'Nonce is not available')

      const amount = parseUnits(amountStr, balance.decimals)
      assert(balance.value >= amount, 'Insufficient balance')
      const sender = sendAccount?.address as `0x${string}`
      assert(isAddress(sender), 'No sender address')

      const receipt = await sendUserOp({
        sender,
        token: token as `0x${string}`,
        amount,
        to: profile.address,
        initCode,
        nonce: BigInt(nonce),
      })
      assert(receipt.success, 'Failed to send user op')
      setSentUserOpHash(receipt.userOpHash)
      toast.show(`Sent user op ${receipt.userOpHash}!`)
      balanceRefetch()
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
        formProps={{
          testID: 'SendForm',
        }}
        defaultValues={{
          token: '',
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
      >
        {({ amount, token }) => (
          <>
            {balance ? (
              <Paragraph testID="SendFormBalance">
                {balance.symbol} Balance:{' '}
                {formatAmount(formatUnits(balance.value, balance.decimals), undefined, 4)}
              </Paragraph>
            ) : balanceIsPending ? (
              <Spinner size="small" />
            ) : null}
            {amount}
            {token}
          </>
        )}
      </SchemaForm>
    </FormProvider>
  )
}
