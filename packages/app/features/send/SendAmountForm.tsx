import { Button, Paragraph, Spinner, SubmitButton, XStack, YStack, Stack, Container } from '@my/ui'
import { z } from 'zod'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { useSendAccounts } from 'app/utils/send-accounts'
import { formatUnits, parseUnits } from 'viem'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { useBalance } from 'wagmi'
import { formatAmount } from 'app/utils/formatAmount'

import { coins } from 'app/data/coins'
import { useSendParams } from 'app/routers/params'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'

// @todo add currency field
const SendAmountSchema = z.object({
  amount: formFields.number,
  token: formFields.select,
})

export function SendAmountForm() {
  const form = useForm<z.infer<typeof SendAmountSchema>>()
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]
  const router = useRouter()

  const { setParams } = useSendParams()
  const {
    params: { amount: amountParam, sendToken: tokenParam, recipient: recipientParam },
  } = useSendParams()

  const token = form.watch('token')

  useEffect(() => {
    const subscription = form.watch(({ amount, token }) => {
      setParams(
        {
          amount: amount?.toString(),
          sendToken: token as `0x${string}` | 'eth',
        },
        { webBehavior: 'replace' }
      )
    })
    return () => subscription.unsubscribe()
  }, [form, setParams])

  // need balance to check if user has enough to send
  const {
    data: balance,
    isPending: balanceIsPending,
    error: balanceError,
    refetch: balanceRefetch,
  } = useBalance({
    address: sendAccount?.address,
    token: (token === 'eth' ? undefined : token) as `0x${string}` | undefined,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  async function onSubmit() {
    if (!canSubmit) return
    const sendToken = (tokenParam || usdcAddress[baseMainnet.id]) as `0x${string}` | 'eth'
    router.push({
      pathname: '/send/confirm',
      query: {
        recipient: recipientParam,
        amount: amountParam,
        sendToken: sendToken,
      },
    })
  }

  const parsedAmount = parseUnits((amountParam ?? '0').toString(), balance?.decimals ?? 0)

  const canSubmit = balance?.value ?? BigInt(0) >= parsedAmount

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        schema={SendAmountSchema}
        onSubmit={onSubmit}
        props={{
          token: {
            options: coins.map((coin) => ({ name: coin.symbol, value: coin.token })),
          },
          amount: {
            h: '$11',
            br: '$8',
            '$theme-dark': {
              bc: '$darkest',
            },
            '$theme-light': {
              bc: '$gray3Light',
            },
            $sm: { bc: 'transparent', w: '100%', ta: 'center' },
            color: '$color12',
            fontSize: 112,
            fontWeight: '400',
            lineHeight: '$1',
            autoFocus: true,
            borderColor: 'transparent',
            outlineColor: 'transparent',
            hoverStyle: {
              borderColor: 'transparent',
              outlineColor: 'transparent',
            },
            focusStyle: {
              borderColor: 'transparent',
              outlineColor: 'transparent',
            },
            fontFamily: '$mono',
          },
        }}
        formProps={{
          testID: 'SendForm',
          $gtSm: { maxWidth: '100%' },
          jc: 'flex-start',
          f: 1,
        }}
        defaultValues={{
          token: tokenParam || coins.find((coin) => coin.label === 'USDC')?.token,
          amount: Number(amountParam || '0'),
        }}
        renderAfter={({ submit }) => (
          <XStack $gtLg={{ ai: 'flex-end', ml: 'auto' }} jc="center">
            <SubmitButton
              theme="accent"
              onPress={submit}
              px="$15"
              br={12}
              disabledStyle={{ opacity: 0.5 }}
              disabled={!canSubmit}
            >
              <Button.Text>Continue</Button.Text>
            </SubmitButton>
          </XStack>
        )}
      >
        {({ amount, token }) => (
          <YStack gap="$5" $gtSm={{ maw: 500 }} $gtLg={{ mx: 0 }} mx="auto" f={1}>
            {amount}
            <XStack jc="center" $gtLg={{ jc: 'flex-end' }} ai="center" gap="$3">
              <Stack
                borderWidth="$0.5"
                $theme-light={{ boc: '$black' }}
                boc={'$decay'}
                p="$3"
                br="$2"
                miw={121}
                jc={'center'}
                ai="center"
              >
                {(() => {
                  switch (true) {
                    case balanceIsPending:
                      return <Spinner size="small" />
                    case !balance || balanceError !== null:
                      return (
                        <Paragraph testID="SendFormBalance">
                          {balanceError !== null ? balanceError.message : 'Insufficient balance'}
                        </Paragraph>
                      )
                    default:
                      return (
                        <Paragraph testID="SendFormBalance">
                          BAL:{' '}
                          {formatAmount(formatUnits(balance.value, balance.decimals), undefined, 4)}
                        </Paragraph>
                      )
                  }
                })()}
              </Stack>
              {token}
            </XStack>
          </YStack>
        )}
      </SchemaForm>
    </FormProvider>
  )
}
