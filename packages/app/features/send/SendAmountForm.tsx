import {
  Button,
  ButtonText,
  isWeb,
  Paragraph,
  Spinner,
  Stack,
  SubmitButton,
  XStack,
  YStack,
} from '@my/ui'
import { type allCoins, allCoinsDict } from 'app/data/coins'
import { useSendScreenParams } from 'app/routers/params'
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
import { ProfileAboutTile } from 'app/features/profile/components/ProfileAboutTile'
import { useThemeSetting } from '@tamagui/next-theme'

const SendAmountSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
})

export function SendAmountForm() {
  const form = useForm<z.infer<typeof SendAmountSchema>>()
  const router = useRouter()
  const [sendParams, setSendParams] = useSendScreenParams()
  const selectedToken = useCoinFromSendTokenParam()
  const {
    coin: { balance, token, decimals },
  } = selectedToken
  const { isLoading: isLoadingCoins } = useCoins()
  const { recipient, idType } = sendParams
  const { data: profile } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  const [isProfileInfoVisible, setIsProfileInfoVisible] = useState<boolean>(false)
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const { resolvedTheme } = useThemeSetting()

  const isDarkTheme = resolvedTheme?.startsWith('dark')

  useEffect(() => {
    const subscription = form.watch(({ amount, token: _token }) => {
      const token = _token as allCoins[number]['token']
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

  const insufficientAmount =
    balance !== undefined && sendParams.amount !== undefined && parsedAmount > balance

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

  const toggleIsProfileInfoVisible = () => {
    setIsProfileInfoVisible((prevState) => !prevState)
  }

  return (
    <XStack w={'100%'} gap={'$4'}>
      <YStack
        f={1}
        gap={'$4'}
        display={isProfileInfoVisible ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
        }}
      >
        {profile && (
          <ProfileHeader onPress={toggleIsProfileInfoVisible} otherUserProfile={profile} />
        )}
        <Paragraph size={'$8'} mt={'$4'}>
          Recipients gets
        </Paragraph>
        <FormProvider {...form}>
          <SchemaForm
            form={form}
            schema={SendAmountSchema}
            onSubmit={onSubmit}
            props={{
              amount: {
                fontSize: (() => {
                  switch (true) {
                    case formAmount?.length <= 9:
                      return '$8'
                    case formAmount?.length > 16:
                      return '$6'
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
                fontWeight: '400',
                bw: 0,
                br: 0,
                p: 0,
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
                inputMode: decimals ? 'decimal' : 'numeric',
                onChangeText: (amount) => {
                  const localizedAmount = localizeAmount(amount)
                  form.setValue('amount', localizedAmount)
                },
                onFocus: () => setIsInputFocused(true),
                onBlur: () => setIsInputFocused(false),
                fieldsetProps: {
                  width: '70%',
                },
              },
              token: {
                defaultValue: token,
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
              token: token,
              amount: sendParams.amount
                ? localizeAmount(formatUnits(BigInt(sendParams.amount), decimals))
                : undefined,
            }}
            renderAfter={({ submit }) => (
              <SubmitButton
                theme="green"
                onPress={submit}
                py={'$5'}
                br={'$2'}
                mb={'$6'}
                disabledStyle={{ opacity: 0.5 }}
                disabled={!canSubmit}
              >
                <Button.Text fontWeight={'600'}>SEND</Button.Text>
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
                                  {formatAmount(formatUnits(balance || 0, decimals), 12, 4)}
                                </Paragraph>
                              </XStack>
                              {insufficientAmount && (
                                <Paragraph color={'$error'} size={'$5'}>
                                  Insufficient tokens
                                </Paragraph>
                              )}
                            </XStack>
                          )
                      }
                    })()}
                  </Stack>
                  <Button
                    chromeless
                    unstyled
                    onPress={() => {
                      form.setValue('amount', localizeAmount(formatUnits(balance, decimals)))
                    }}
                    $theme-light={{ borderBottomColor: '$color12' }}
                  >
                    <ButtonText
                      color={balance === parsedAmount ? '$primary' : '$silverChalice'}
                      size={'$5'}
                      textDecorationLine={'underline'}
                      hoverStyle={{
                        color: isDarkTheme ? '$primary' : '$color12',
                      }}
                      $theme-light={{
                        color: balance === parsedAmount ? '$color12' : '$darkGrayTextField',
                      }}
                    >
                      MAX
                    </ButtonText>
                  </Button>
                </XStack>
              </YStack>
            )}
          </SchemaForm>
        </FormProvider>
      </YStack>
      {isProfileInfoVisible && (
        <YStack
          w={'100%'}
          ai={'center'}
          $gtLg={{
            width: '35%',
            minWidth: 400,
            height: isWeb ? '81vh' : 'auto',
            // @ts-expect-error typescript is complaining about overflowY not available and advising overflow. Overflow will work differently than overflowY here, overflowY is working fine
            overflowY: 'scroll',
          }}
          className={'hide-scroll'}
        >
          <YStack
            w={'100%'}
            maxWidth={500}
            pb={'$10'}
            $gtLg={{
              pb: 0,
            }}
          >
            <ProfileAboutTile otherUserProfile={profile} onClose={toggleIsProfileInfoVisible} />
          </YStack>
        </YStack>
      )}
    </XStack>
  )
}
