import { Button, Card, H1, Paragraph, XStack, YStack, SubmitButton, Stack } from '@my/ui'
import { z } from 'zod'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import type { PropsWithChildren } from 'react'
import { coins, coinsDict, sendCoin } from 'app/data/coins'
import { IconCoin } from 'app/components/icons/IconCoin'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { formatUnits } from 'viem'
import formatAmount from 'app/utils/formatAmount'

const removeDuplicateInString = (text: string, substring: string) => {
  const [first, ...after] = text.split(substring)
  return first + (after.length ? `${substring}${after.join('')}` : '')
}

export function OpenPosition() {
  return (
    <YStack pt={'$size.3.5'} $gtLg={{ pt: 0 }} f={1} $gtMd={{ ml: '$4' }}>
      <YStack pb={'$size.3.5'} gap="$size.0.9">
        <H1 size={'$9'} fontWeight={'900'} color="$color12" tt={'uppercase'}>
          Open a new position
        </H1>
        <Paragraph color={'$color10'} size={'$5'} maw={650}>
          Liquidity Providers get to share 1.5% of all swaps (added to your rewards automatically),
          and 5b in $SEND rewards over 12 months.
        </Paragraph>
      </YStack>

      <YStack $gtMd={{ fd: 'row' }} gap={'$size.1.5'}>
        <OpenPositionForm />
      </YStack>
    </YStack>
  )
}

const OpenPositionForm = () => {
  const form = useForm<z.infer<typeof OpenPositionSchema>>()
  const { balances } = useSendAccountBalances()

  const formToken = form.watch('token')
  const formTokenAmount = form.watch('tokenAmount')
  const formSendAmount = form.watch('sendAmount')

  const [tokenSymbol, tokenDecimals] = [
    coinsDict[formToken]?.symbol,
    coinsDict[formToken]?.decimals,
  ]

  const sendBalance = (
    balances?.SEND ? formatUnits(balances.SEND, sendCoin.decimals) : 0n
  ).toString()
  const tokenBalance = formatUnits(balances?.[tokenSymbol] ?? 0n, tokenDecimals)

  const canSubmit =
    formTokenAmount &&
    Number(formTokenAmount) > 0 &&
    Number(formTokenAmount) <= Number(tokenBalance) &&
    formSendAmount &&
    Number(formSendAmount) > 0 &&
    Number(formSendAmount) <= Number(sendBalance)

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        schema={OpenPositionSchema}
        onSubmit={() => {}}
        props={{
          tokenAmount: {
            ...sharedStyles,
            onChangeText: (text) => {
              const formattedText = removeDuplicateInString(text, '.').replace(/[^0-9.]/g, '') //remove duplicate "." then filter out any letters
              form.setValue('tokenAmount', formattedText)
            },
          },
          sendAmount: {
            ...sharedStyles,
            inputMode: 'numeric',
            onChangeText: (text) => {
              const formattedText = text.replace(/[^0-9]/g, '') // only accept numbers
              form.setValue('sendAmount', formattedText)
            },
          },
          token: {
            supportedCoins: coins.filter(({ symbol }) => symbol !== 'SEND'),
          },
        }}
        defaultValues={{
          token: 'eth',
        }}
        formProps={{
          testID: 'OpenPositionForm',
          $gtSm: { maxWidth: '100%' },
          jc: 'flex-start',
          als: 'flex-start',
          f: 1,
          height: '100%',
        }}
        renderAfter={({ submit }) => (
          <XStack mt={'$size.3.5'}>
            <SubmitButton
              variant={!canSubmit ? 'outlined' : undefined}
              theme={canSubmit ? 'green' : 'dim'}
              borderRadius={'$4'}
              disabled={!canSubmit}
              // @TODO: submit
              onPress={() => console.log('press')}
            >
              <Button.Text
                tt={'uppercase'}
                color={canSubmit ? '$color1' : '$color12'}
                fontWeight={500}
                ff="$mono"
              >
                {canSubmit ? 'Provide Liquidity' : 'Enter USDC or SEND Amount'}
              </Button.Text>
            </SubmitButton>
          </XStack>
        )}
      >
        {({ token, tokenAmount, sendAmount }) => (
          <YStack $gtMd={{ fd: 'row' }} gap={'$size.1.5'}>
            <FormCard
              balance={tokenBalance}
              onMaxPress={() => form.setValue('tokenAmount', tokenBalance)}
            >
              <Stack w={'$size.3.5'}>
                {coinsDict[formToken] && (
                  <IconCoin coin={coinsDict[formToken]} size={'$size.3.5'} />
                )}
              </Stack>
              {tokenAmount}
              {token}
            </FormCard>

            <FormCard
              balance={sendBalance}
              onMaxPress={() => form.setValue('sendAmount', sendBalance)}
            >
              <Stack>
                <IconCoin coin={sendCoin} size={'$size.3.5'} />
              </Stack>
              {sendAmount}
              <Paragraph fontWeight={600} fontSize={'$8'}>
                SEND
              </Paragraph>
            </FormCard>
          </YStack>
        )}
      </SchemaForm>
    </FormProvider>
  )
}

const OpenPositionSchema = z.object({
  token: formFields.coin,
  tokenAmount: formFields.text,
  sendAmount: formFields.text,
})

const FormCard = ({
  balance,
  onMaxPress,
  children,
}: {
  balance: string
  onMaxPress: () => void
} & PropsWithChildren) => {
  return (
    <Card p={'$size.3.5'} flex={1}>
      <XStack
        pb="$size.0.9"
        borderBottomColor={'$color10'}
        borderBottomWidth={1}
        justifyContent="space-between"
        alignItems="center"
        gap="$size.0.9"
      >
        {children}
      </XStack>

      <XStack pt="$size.0.9" justifyContent="space-between">
        <XStack gap="$size.0.75">
          <Paragraph color="$color10" size={'$5'}>
            Balance:
          </Paragraph>
          <Paragraph size={'$5'} fontWeight={'600'}>
            {formatAmount(balance, 9, 2)}
          </Paragraph>
        </XStack>
        <Button unstyled onPress={onMaxPress}>
          <Button.Text size={'$5'} color="$color10" textDecorationLine="underline">
            MAX
          </Button.Text>
        </Button>
      </XStack>
    </Card>
  )
}

const sharedStyles = {
  fieldsetProps: { flex: 1 },
  backgroundColor: '$color1',
  flex: 1,
  inputMode: 'decimal',
  fontSize: '$9',
  ff: '$mono',
  placeholder: '0',
  p: 0,
  lineHeight: '$1',
  borderColor: 'transparent',
  outlineColor: 'transparent',
  fontStyle: 'normal',
  '$theme-dark': {
    placeholderTextColor: '$color10',
  },
  $sm: {
    w: '100%',
  },
} as const
