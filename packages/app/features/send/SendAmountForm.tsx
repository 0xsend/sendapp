import { Button, Paragraph, Spinner, Stack, SubmitButton, XStack, YStack } from '@my/ui'
import { allCoinsDict, type CoinWithBalance } from 'app/data/coins'
import { useSendScreenParams } from 'app/routers/params'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import formatAmount from 'app/utils/formatAmount'

import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'

import { z } from 'zod'
import { SendRecipient } from './confirm/screen'
import { sanitizeAmount, localizeAmount } from 'app/utils/formatAmount'

import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useCoins } from 'app/provider/coins'

const SendAmountSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
})

export function SendAmountForm() {
  const form = useForm<z.infer<typeof SendAmountSchema>>()
  const router = useRouter()
  const [sendParams, setSendParams] = useSendScreenParams()
  const selectedToken = useCoinFromSendTokenParam()
  const { balance, token, decimals } = selectedToken
  const { isLoading: isLoadingCoins } = useCoins()

  useEffect(() => {
    const subscription = form.watch(({ amount, token: _token }) => {
      const token = _token as CoinWithBalance['token']
      // use allCoinsDict because form updates before query params. This feels hacky
      const sanitizedAmount = sanitizeAmount(amount, allCoinsDict[token].decimals)
      setSendParams(
        {
          ...sendParams,
          amount: sanitizedAmount.toString(),
          sendToken: token,
        },
        { webBehavior: 'replace' }
      )
    })
    return () => subscription.unsubscribe()
  }, [form, setSendParams, sendParams])

  const parsedAmount = BigInt(sendParams.amount ?? '0')
  const formAmount = form.watch('amount')

  const canSubmit =
    !isLoadingCoins &&
    balance !== undefined &&
    sendParams.amount !== undefined &&
    balance >= parsedAmount &&
    parsedAmount > BigInt(0)

  async function onSubmit() {
    if (!canSubmit) return

    router.push({
      pathname: '/send/confirm',
      query: {
        idType: sendParams.idType,
        recipient: sendParams.recipient,
        amount: sendParams.amount,
        sendToken: token,
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
              fontSize: (() => {
                switch (true) {
                  case formAmount === undefined:
                    return '$14'
                  case formAmount.length > 6:
                    return '$11'
                  case formAmount.length > 9:
                    return '$9'
                  default:
                    return '$14'
                }
              })(),
            },
            color: '$color12',
            fontSize: (() => {
              switch (true) {
                case formAmount === undefined:
                  return 112
                case formAmount.length > 9:
                  return '$12'

                case formAmount.length > 6:
                  return '$13'
                default:
                  return 112
              }
            })(),
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
            inputMode: decimals ? 'decimal' : 'numeric',
            onChangeText: (amount) => {
              const localizedAmount = localizeAmount(amount)
              form.setValue('amount', localizedAmount)
            },
          },
          token: {
            defaultValue: token,
          },
        }}
        formProps={{
          testID: 'SendForm',
          $gtSm: { maxWidth: '100%' },
          jc: 'flex-start',
          f: 1,
          height: '100%',
        }}
        defaultValues={{
          token: token,
          amount: sendParams.amount
            ? localizeAmount(formatUnits(BigInt(sendParams.amount), decimals))
            : undefined,
        }}
        renderAfter={({ submit }) => (
          <YStack gap="$5" $gtSm={{ maw: 500 }} $gtLg={{ mx: 0 }} mx="auto">
            <SubmitButton
              theme="green"
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
            <SendRecipient />
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
                    case isLoadingCoins:
                      return <Spinner size="small" />
                    case !balance:
                      return null
                    default:
                      return (
                        <Paragraph testID="SendFormBalance">
                          BAL: {formatAmount(formatUnits(balance, decimals), undefined, 4)}
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
