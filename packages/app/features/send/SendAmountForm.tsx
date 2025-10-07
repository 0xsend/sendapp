import {
  Button,
  Card,
  Paragraph,
  Spinner,
  Stack,
  SubmitButton,
  type TamaguiElement,
  useDebounce,
  XStack,
  YStack,
} from '@my/ui'
import { type allCoins, allCoinsDict } from 'app/data/coins'
import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'

import { type BRAND, z } from 'zod'

import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useCoins } from 'app/provider/coins'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import ProfileHeader from 'app/features/profile/components/ProfileHeader'
import { ProfilesDetailsModal } from 'app/features/profile/components/ProfileDetailsModal'
import { IconX } from 'app/components/icons'
import { MAX_NOTE_LENGTH } from 'app/components/FormFields/NoteField'
import { Platform } from 'react-native'

const SendAmountSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
  note: formFields.note,
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

  const [isAmountInputFocused, setIsAmountInputFocused] = useState<boolean>(false)
  const [isNoteInputFocused, setIsNoteInputFocused] = useState<boolean>(false)
  const noteFieldRef = useRef<TamaguiElement>(null)

  const noteValidationError = form.formState.errors.note

  const onFormChange = useDebounce(
    useCallback(
      (values) => {
        const { amount, token: _token, note } = values
        const sendToken = _token as allCoins[number]['token']
        const sanitizedAmount = sanitizeAmount(
          amount,
          allCoinsDict[sendToken]?.decimals
        )?.toString()

        const noteValidation = formFields.note.safeParse(note)
        if (noteValidation.error) {
          form.setError('note', {
            message:
              noteValidation.error.errors[0]?.message ??
              'Note failed to match validation constraints',
          })
        } else {
          form.clearErrors('note')
        }
        setSendParams(
          {
            ...sendParams,
            amount: sanitizedAmount,
            sendToken,
            note: note.trim(),
          },
          { webBehavior: 'replace' }
        )
      },
      [setSendParams, sendParams, form]
    ),
    300,
    { leading: false },
    []
  )

  useEffect(() => {
    const subscription = form.watch(onFormChange)

    return () => {
      subscription.unsubscribe()
      onFormChange.cancel()
    }
  }, [form.watch, onFormChange])

  const parsedAmount = BigInt(sendParams.amount ?? '0')
  const formAmount = form.watch('amount')

  const minimumAmount = coin?.minAmount
    ? BigInt(Math.floor(coin.minAmount * 10 ** coin.decimals))
    : BigInt(0)

  const belowMinimum =
    coin?.minAmount !== undefined &&
    sendParams.amount !== undefined &&
    parsedAmount > BigInt(0) &&
    parsedAmount < minimumAmount

  const canSubmit =
    !isLoadingCoins &&
    coin?.balance !== undefined &&
    sendParams.amount !== undefined &&
    coin.balance >= parsedAmount &&
    parsedAmount > BigInt(0) &&
    !belowMinimum &&
    !noteValidationError

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
        note: sendParams.note,
      },
    })
  }

  const handleNoteClearClick = () => {
    form.setValue('note', '' as string & BRAND<'note'>)
    form.clearErrors('note')
  }

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <SubmitButton onPress={submit} disabled={!canSubmit}>
        <SubmitButton.Text>CONTINUE</SubmitButton.Text>
      </SubmitButton>
    ),
    [canSubmit]
  )

  const noteBorderActiveColor = form.formState.errors.note ? '$error' : 'transparent'

  return (
    <XStack w={'100%'} gap={'$4'} f={Platform.OS === 'web' ? undefined : 1}>
      <YStack
        f={1}
        gap={'$5'}
        display={profileParam ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
          pb: '$3.5',
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
                    case formAmount?.length > 12:
                      return '$6'
                    default:
                      return '$8'
                  }
                })(),
                $gtLg: {
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
                onFocus: () => setIsAmountInputFocused(true),
                onBlur: () => setIsAmountInputFocused(false),
                fieldsetProps: {
                  width: '60%',
                },
                autoFocus: Platform.OS === 'web',
              },
              token: {
                defaultValue: coin?.token,
              },
              note: {
                flex: 1,
                w: '100%',
                ref: noteFieldRef,
                py: '$4',
                px: '$5',
                pr: '$10',
                fontSize: 17,
                fontStyle: 'normal',
                minHeight: 40,
                '$theme-dark': {
                  placeholderTextColor: '$darkGrayTextField',
                },
                '$theme-light': {
                  placeholderTextColor: '$darkGrayTextField',
                },
                focusStyle: {
                  boc: noteBorderActiveColor,
                  bw: 1,
                  outlineWidth: 0,
                  fontStyle: 'normal',
                },
                hoverStyle: {
                  boc: noteBorderActiveColor,
                },
                iconAfter: sendParams.note && (
                  <Button
                    unstyled
                    chromeless
                    cursor={'pointer'}
                    mr={Platform.OS === 'web' ? 0 : '$3'}
                    icon={
                      <IconX
                        color={'$primary'}
                        $theme-light={{ color: '$darkGrayTextField' }}
                        size="$1"
                      />
                    }
                    onPress={handleNoteClearClick}
                  />
                ),
                onFocus: () => setIsNoteInputFocused(true),
                onBlur: () => setIsNoteInputFocused(false),
              },
            }}
            formProps={{
              testID: 'SendForm',
              footerProps: { p: 0 },
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
              note: sendParams.note || '',
            }}
            renderAfter={renderAfterContent}
          >
            {({ amount, token, note }) => (
              <YStack gap="$5">
                <Card
                  gap="$5"
                  $gtSm={{ p: '$7' }}
                  bc={'$color1'}
                  br={'$6'}
                  p={'$5'}
                  borderColor={insufficientAmount || belowMinimum ? '$error' : 'transparent'}
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
                      backgroundColor={isAmountInputFocused ? '$primary' : '$darkGrayTextField'}
                      $theme-light={{
                        backgroundColor: isAmountInputFocused ? '$color12' : '$lightGrayTextField',
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
                                    color={
                                      insufficientAmount || belowMinimum
                                        ? '$error'
                                        : '$silverChalice'
                                    }
                                    size={'$5'}
                                    $theme-light={{
                                      color:
                                        insufficientAmount || belowMinimum
                                          ? '$error'
                                          : '$darkGrayTextField',
                                    }}
                                  >
                                    Balance:
                                  </Paragraph>
                                  <Paragraph
                                    color={
                                      insufficientAmount || belowMinimum ? '$error' : '$color12'
                                    }
                                    size={'$5'}
                                    fontWeight={'600'}
                                  >
                                    {formatAmount(formatUnits(coin.balance, coin.decimals), 12, 4)}
                                  </Paragraph>
                                </XStack>
                                {insufficientAmount && (
                                  <Paragraph color={'$error'} size={'$5'}>
                                    Insufficient funds
                                  </Paragraph>
                                )}
                                {belowMinimum && coin?.minAmount !== undefined && (
                                  <Paragraph
                                    color={'$error'}
                                    size={'$5'}
                                    testID="SendFormMinimumError"
                                  >
                                    Minimum: {formatAmount(coin.minAmount.toString(), 12, 4)}{' '}
                                    {coin.symbol}
                                  </Paragraph>
                                )}
                              </XStack>
                            )
                        }
                      })()}
                    </Stack>
                  </XStack>
                </Card>
                <YStack gap={'$2'}>
                  <Card unstyled>{note}</Card>
                  {(isNoteInputFocused || noteValidationError) && (
                    <Paragraph
                      color={noteValidationError ? '$error' : '$lightGrayTextField'}
                      $theme-light={{ color: '$darkGrayTextField' }}
                    >
                      {noteValidationError
                        ? noteValidationError.message
                        : `Max: ${MAX_NOTE_LENGTH} characters`}
                    </Paragraph>
                  )}
                </YStack>
              </YStack>
            )}
          </SchemaForm>
        </FormProvider>
      </YStack>
      <ProfilesDetailsModal />
    </XStack>
  )
}
