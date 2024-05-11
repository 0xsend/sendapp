import { Button, Paragraph, Spinner, SubmitButton, XStack, useToastController } from '@my/ui'
import { z } from 'zod'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { useSendAccounts } from 'app/utils/send-accounts'
import { type Hex, formatUnits, parseUnits, isAddress } from 'viem'
import { baseMainnet, sendTokenAddress, usdcAddress as usdcAddresses } from '@my/wagmi'
import { useState } from 'react'
import type { ProfileProp } from './SendDialog'
import { useBalance } from 'wagmi'
import formatAmount from 'app/utils/formatAmount'
import {
  useGenerateTransferUserOp,
  useUserOpGasEstimate,
  useUserOpTransferMutation,
} from 'app/utils/useUserOpTransferMutation'
import { assert } from 'app/utils/assert'
import { useLink } from 'solito/link'
import { useAccountNonce } from 'app/utils/userop'

// @todo add currency field
const SendFormSchema = z.object({
  amount: formFields.text.describe('Amount'),
  token: formFields.select.describe('Token'),
})

export function SendForm({ profile }: { profile: ProfileProp }) {
  const toast = useToastController()
  const form = useForm<z.infer<typeof SendFormSchema>>()
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]
  const [sentUserOpTxHash, setSentUserOpTxHash] = useState<Hex>()
  const token = form.watch('token') as `0x${string}` | undefined
  // need balance to check if user has enough to send
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
  const amount = parseUnits(form.watch('amount') ?? '0', balance?.decimals ?? 0)
  // need nonce to send transaction
  const { data: nonce, error: nonceError } = useAccountNonce({ sender: sendAccount?.address })
  const { data: userOp } = useGenerateTransferUserOp({
    sender: sendAccount?.address,
    to: profile?.address,
    token,
    amount: BigInt(amount),
    nonce: nonce ?? 0n,
  })
  const { data: gasEstimate } = useUserOpGasEstimate({ userOp })
  const { mutateAsync: sendUserOp } = useUserOpTransferMutation()
  const sentTxLink = useLink({
    href: `${baseMainnet.blockExplorers.default.url}/tx/${sentUserOpTxHash}`,
  })
  console.log('gasEstimate', gasEstimate)
  console.log('userOp', userOp)
  async function onSubmit() {
    try {
      assert(!!userOp, 'User op is required')
      assert(!!balance, 'Balance is not available')
      assert(nonceError === null, `Failed to get nonce: ${nonceError}`)
      assert(nonce !== undefined, 'Nonce is not available')

      assert(balance.value >= amount, 'Insufficient balance')
      const sender = sendAccount?.address as `0x${string}`
      assert(isAddress(sender), 'No sender address')

      const receipt = await sendUserOp({
        userOp,
      })
      assert(receipt.success, 'Failed to send user op')
      setSentUserOpTxHash(receipt.receipt.transactionHash)
      toast.show(`Sent user op ${receipt.receipt.transactionHash}!`)
      balanceRefetch()
    } catch (e) {
      console.error(e)
      toast.show('Failed to send user op')
      form.setError('amount', { type: 'custom', message: `${e}` })
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
              { name: 'USDC', value: usdcAddresses[baseMainnet.id] },
              { name: 'SEND', value: sendTokenAddress[baseMainnet.id] },
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
          sentUserOpTxHash ? (
            <Button {...sentTxLink}>
              <Button.Text>View on {baseMainnet.blockExplorers.default.name}</Button.Text>
            </Button>
          ) : (
            <XStack>
              <SubmitButton theme="accent" onPress={submit}>
                <Button.Text>Send</Button.Text>
              </SubmitButton>
            </XStack>
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
