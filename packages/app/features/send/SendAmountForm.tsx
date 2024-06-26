import type { Functions } from '@my/supabase/database.types'
import { Button, Paragraph, Spinner, Stack, SubmitButton, XStack, YStack } from '@my/ui'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { coins, type coin } from 'app/data/coins'
import { useSendScreenParams } from 'app/routers/params'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { formatUnits, parseUnits } from 'viem'
import { useBalance } from 'wagmi'
import { z } from 'zod'
import { SendRecipient } from './confirm/screen'

const removeDuplicateInString = (text: string, substring: string) => {
  const [first, ...after] = text.split(substring)
  return first + (after.length ? `${substring}${after.join('')}` : '')
}

const SendAmountSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
})

export function SendAmountForm({ profile }: { profile: Functions<'profile_lookup'>[number] }) {
  const form = useForm<z.infer<typeof SendAmountSchema>>()
  const { data: sendAccount } = useSendAccount()
  const router = useRouter()

  const [sendParams, setSendParams] = useSendScreenParams()
  const token = form.watch('token')

  // need balance to check if user has enough to send
  const {
    data: balance,
    isLoading: balanceIsLoading,
    error: balanceError,
  } = useBalance({
    address: sendAccount?.address,
    token: (token === 'eth' ? undefined : token) as `0x${string}` | undefined,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  useEffect(() => {
    const subscription = form.watch(({ amount, token }) => {
      setSendParams(
        {
          ...sendParams,
          amount: amount,
          sendToken: token as `0x${string}` | 'eth',
        },
        { webBehavior: 'replace' }
      )
    })
    return () => subscription.unsubscribe()
  }, [form, setSendParams, sendParams])

  const sendToken = sendParams.sendToken ?? usdcAddress[baseMainnet.id]
  const selectedCoin = coins.find((c) => c.token === sendToken) ?? (coins[0] as coin)
  const parsedAmount = parseUnits(sendParams.amount ?? '0', selectedCoin.decimals)

  const canSubmit =
    !balanceIsLoading &&
    balance?.value !== undefined &&
    sendParams.amount !== undefined &&
    balance?.value > parsedAmount && // @todo: ensure enough USDC for gas fees
    parsedAmount > BigInt(0)

  async function onSubmit() {
    if (!canSubmit) return
    const sendToken = sendParams.sendToken || usdcAddress[baseMainnet.id]

    const amount = formatUnits(parsedAmount, selectedCoin.decimals)
    router.push({
      pathname: '/send/confirm',
      query: {
        idType: sendParams.idType,
        recipient: sendParams.recipient,
        amount: amount,
        sendToken: sendToken,
      },
    })
  }

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        schema={SendAmountSchema}
        onSubmit={onSubmit}
        props={{
          amount: {
            h: '$11',
            br: '$8',
            '$theme-dark': {
              bc: '$darkest',
            },
            '$theme-light': {
              bc: '$gray3Light',
            },
            $sm: {
              bc: 'transparent',
              w: '100%',
              ta: 'center',
            },
            color: '$color12',
            fontSize: 112,
            fontWeight: '400',
            lineHeight: '$1',
            autoFocus: true,
            hoverStyle: {
              borderColor: 'transparent',
              outlineColor: 'transparent',
            },
            focusStyle: {
              borderColor: '$borderColorFocus',
            },
            outlineColor: '$outlineColor',
            outlineWidth: 1,
            outlineStyle: 'solid',
            fontFamily: '$mono',
            inputMode: balance?.decimals ? 'decimal' : 'numeric',
            onChangeText: (text) => {
              const formattedText = removeDuplicateInString(text, '.').replace(/[^0-9.]/g, '') //remove duplicate "." then filter out any letters
              form.setValue('amount', formattedText)
            },
          },
        }}
        formProps={{
          testID: 'SendForm',
          $gtSm: { maxWidth: '100%' },
          jc: 'flex-start',
          als: 'flex-start',
          f: 1,
          height: '100%',
        }}
        defaultValues={{
          token: sendParams.sendToken || usdcAddress[baseMainnet.id],
          amount: sendParams.amount,
        }}
        renderAfter={({ submit }) => (
          <YStack gap="$5" $gtSm={{ maw: 500 }} $gtLg={{ mx: 0 }} mx="auto">
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
          </YStack>
        )}
      >
        {({ amount, token }) => (
          <YStack gap="$5" $gtSm={{ maw: 500 }} $gtLg={{ mx: 0 }} mx="auto">
            <SendRecipient profile={profile} />
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
                    case balanceIsLoading:
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
