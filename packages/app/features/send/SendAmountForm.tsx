import { Button, Paragraph, Spinner, Stack, SubmitButton, XStack, YStack } from '@my/ui'
import { type allCoins, allCoinsDict } from 'app/data/coins'
import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'

import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'

import { z } from 'zod'

import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useCoins } from 'app/provider/coins'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { ProfileHeader } from 'app/features/profile/components/ProfileHeader'
import { ProfilesDetailsModal } from 'app/features/profile/components/ProfileDetailsModal'

const SendAmountSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
})

export function SendAmountForm() {
  const form = useForm<z.infer<typeof SendAmountSchema>>()
  const router = useRouter()
  const [sendParams, setSendParams] = useSendScreenParams()
  const { coin } = useCoinFromSendTokenParam()
  const { isLoading: isLoadingCoins } = useCoins()
  const { recipient, idType } = sendParams
  const { data: profile } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  const [{ profile: profileParam }] = useRootScreenParams()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)

  useEffect(() => {
    const subscription = form.watch(({ amount, token: _token }) => {
      const token = _token as allCoins[number]['token']
      // use allCoinsDict because form updates before query params. This feels hacky
      const sanitizedAmount = sanitizeAmount(amount, allCoinsDict[token]?.decimals)
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
    coin?.balance !== undefined &&
    sendParams.amount !== undefined &&
    coin.balance >= parsedAmount &&
    parsedAmount > BigInt(0)

  const insufficientAmount =
    coin?.balance !== undefined && sendParams.amount !== undefined && parsedAmount > coin?.balance

  async function onSubmit() {
    if (!canSubmit) return

    router.push({
      pathname: '/send/confirm',
      query: {
        idType: sendParams.idType,
        recipient: sendParams.recipient,
        amount: sendParams.amount,
        sendToken: coin?.token,
      },
    })
  }

  return (
    <XStack w={'100%'} gap={'$4'}>
      <YStack
        f={1}
        gap={'$4'}
        display={profileParam ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
        }}
        testID={'SendFormContainer'}
      >
        <ProfileHeader profile={profile} idType={idType} recipient={recipient} />
        <FormProvider {...form}>
          <SchemaForm
            form={form}
            schema={SendAmountSchema}
            onSubmit={onSubmit}
            props={{
              amount: {
                fontSize: (() => {
                  switch (true) {
                    case formAmount?.length <= 8:
                      return '$11'
                    case formAmount?.length > 16:
                      return '$7'
                    default:
                      return '$8'
                  }
                })(),
                $gtSm: {
                  fontSize: (() => {
                    switch (true) {
                      case formAmount?.length <= 9:
                        return '$10'
                      case formAmount?.length > 16:
                        return '$8'
                      default:
                        return '$10'
                    }
                  })(),
                },
                color: '$color12',
                fontWeight: '500',
                bw: 0,
                br: 0,
                p: 1,
                focusStyle: {
                  outlineWidth: 0,
                },
                placeholder: '0',
                fontFamily: '$mono',
                '$theme-dark': {
                  placeholderTextColor: '$darkGrayTextField',
                },
                '$theme-light': {
                  placeholderTextColor: '$darkGrayTextField',
                },
                inputMode: coin?.decimals ? 'decimal' : 'numeric',
                onChangeText: (amount) => {
                  const localizedAmount = localizeAmount(amount)
                  form.setValue('amount', localizedAmount)
                },
                onFocus: () => setIsInputFocused(true),
                onBlur: () => setIsInputFocused(false),
                fieldsetProps: {
                  width: '60%',
                },
              },
              token: {
                defaultValue: coin?.token,
              },
            }}
            formProps={{
              testID: 'SendForm',
              justifyContent: 'space-between',
              $gtSm: {
                maxWidth: '100%',
                justifyContent: 'space-between',
              },
            }}
            defaultValues={{
              token: coin?.token,
              amount:
                sendParams.amount && coin !== undefined
                  ? localizeAmount(formatUnits(BigInt(sendParams.amount), coin.decimals))
                  : undefined,
            }}
            renderAfter={({ submit }) => (
              <SubmitButton
                theme="green"
                onPress={submit}
                py={'$5'}
                br={'$4'}
                disabledStyle={{ opacity: 0.5 }}
                disabled={!canSubmit}
              >
                <Button.Text fontWeight={'600'}>CONTINUE</Button.Text>
              </SubmitButton>
            )}
          >
            {({ amount, token }) => (
              <YStack
                gap="$5"
                $gtSm={{ p: '$7' }}
                bg={'$color1'}
                br={'$6'}
                p={'$5'}
                borderColor={insufficientAmount ? '$error' : 'transparent'}
                bw={1}
              >
                <XStack ai={'center'} position="relative" jc={'space-between'}>
                  {amount}
                  {token}
                  <XStack
                    position="absolute"
                    bottom={-8}
                    left={0}
                    right={0}
                    height={1}
                    backgroundColor={isInputFocused ? '$primary' : '$silverChalice'}
                    $theme-light={{
                      backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
                    }}
                  />
                </XStack>
                <XStack jc="space-between" ai={'flex-start'}>
                  <Stack>
                    {(() => {
                      switch (true) {
                        case isLoadingCoins:
                          return <Spinner size="small" />
                        case !coin?.balance:
                          return null
                        default:
                          return (
                            <XStack
                              gap={'$2'}
                              flexDirection={'column'}
                              $gtSm={{ flexDirection: 'row' }}
                            >
                              <XStack gap={'$2'}>
                                <Paragraph
                                  testID="SendFormBalance"
                                  color={insufficientAmount ? '$error' : '$silverChalice'}
                                  size={'$5'}
                                  $theme-light={{
                                    color: insufficientAmount ? '$error' : '$darkGrayTextField',
                                  }}
                                >
                                  Balance:
                                </Paragraph>
                                <Paragraph
                                  color={insufficientAmount ? '$error' : '$color12'}
                                  size={'$5'}
                                  fontWeight={'600'}
                                >
                                  {formatAmount(
                                    formatUnits(coin.balance, coin.decimals),
                                    12,
                                    coin.formatDecimals
                                  )}
                                </Paragraph>
                              </XStack>
                              {insufficientAmount && (
                                <Paragraph color={'$error'} size={'$5'}>
                                  Insufficient funds
                                </Paragraph>
                              )}
                            </XStack>
                          )
                      }
                    })()}
                  </Stack>
                </XStack>
              </YStack>
            )}
          </SchemaForm>
        </FormProvider>
      </YStack>
      <ProfilesDetailsModal />
    </XStack>
  )
}
