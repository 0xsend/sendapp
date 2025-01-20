import {
  Button,
  isWeb,
  Paragraph,
  Spinner,
  Stack,
  SubmitButton,
  useDebounce,
  XStack,
  YStack,
  type TamaguiElement,
} from '@my/ui'
import { type allCoins, allCoinsDict } from 'app/data/coins'
import { useSendScreenParams } from 'app/routers/params'
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
import { ProfileHeader } from 'app/features/profile/components/ProfileHeader'
import { ProfileAboutTile } from 'app/features/profile/components/ProfileAboutTile'
import { IconX } from 'app/components/icons'

const SendAmountSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
  note: formFields.textarea,
})

const MAX_NOTE_LENGTH = 100
const MIN_NOTE_ROWS = 1
const MAX_NOTE_ROWS = 4
const LINE_HEIGHT = 24
const BASE_NOTE_HEIGHT = 60

function adjustNoteFieldHeightForWeb(noteField: HTMLTextAreaElement) {
  noteField.rows = MIN_NOTE_ROWS
  const rows = Math.ceil((noteField.scrollHeight - BASE_NOTE_HEIGHT) / LINE_HEIGHT)
  noteField.rows = Math.min(MAX_NOTE_ROWS, MIN_NOTE_ROWS + rows)
}

export function SendAmountForm() {
  const form = useForm<z.infer<typeof SendAmountSchema>>()
  const router = useRouter()
  const [sendParams, setSendParams] = useSendScreenParams()
  const { coin } = useCoinFromSendTokenParam()
  const { isLoading: isLoadingCoins } = useCoins()
  const { recipient, idType } = sendParams
  const { data: profile } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  const [isProfileInfoVisible, setIsProfileInfoVisible] = useState<boolean>(false)
  const [isAmountInputFocused, setIsAmountInputFocused] = useState<boolean>(false)
  const [isNoteInputFocused, setIsNoteInputFocused] = useState<boolean>(false)
  const noteFieldRef = useRef<TamaguiElement>(null)

  const formNote = form.watch('note')

  const onFormChange = useDebounce(
    useCallback(
      (values) => {
        const { amount, token: _token, note } = values
        const token = _token as allCoins[number]['token']
        const sanitizedAmount = sanitizeAmount(amount, allCoinsDict[token]?.decimals)

        setSendParams(
          {
            ...sendParams,
            amount: sanitizedAmount.toString(),
            sendToken: token,
            note: note, // TODO sanitize
          },
          { webBehavior: 'replace' }
        )
      },
      [setSendParams, sendParams]
    ),
    300,
    { leading: false },
    []
  )

  useEffect(() => {
    const subscription = form.watch((values) => {
      onFormChange(values)
    })

    return () => {
      subscription.unsubscribe()
      onFormChange.cancel()
    }
  }, [form.watch, onFormChange])

  useEffect(() => {
    if (noteFieldRef.current && isWeb && formNote !== undefined) {
      adjustNoteFieldHeightForWeb(noteFieldRef.current as unknown as HTMLTextAreaElement)
    }
  }, [formNote])

  const parsedAmount = BigInt(sendParams.amount ?? '0')
  const formAmount = form.watch('amount')

  const isNoteTooLong = (formNote?.length ?? 0) > MAX_NOTE_LENGTH

  const canSubmit =
    !isLoadingCoins &&
    coin?.balance !== undefined &&
    sendParams.amount !== undefined &&
    coin.balance >= parsedAmount &&
    parsedAmount > BigInt(0) &&
    !isNoteTooLong

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

  const toggleIsProfileInfoVisible = () => {
    setIsProfileInfoVisible((prevState) => !prevState)
  }

  const handleNoteClearClick = () => {
    form.setValue('note', '' as string & BRAND<'textarea'>)
  }

  return (
    <XStack w={'100%'} gap={'$4'}>
      <YStack
        f={1}
        gap={'$5'}
        display={isProfileInfoVisible ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
        }}
        testID={'SendFormContainer'}
      >
        <ProfileHeader
          onPressOut={toggleIsProfileInfoVisible}
          profile={profile}
          idType={idType}
          recipient={recipient}
        />
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
                onFocus: () => setIsAmountInputFocused(true),
                onBlur: () => setIsAmountInputFocused(false),
                fieldsetProps: {
                  width: '60%',
                },
              },
              token: {
                defaultValue: coin?.token,
              },
              note: {
                ref: noteFieldRef,
                rows: 1,
                py: '$4',
                px: '$5',
                pr: '$10',
                fontSize: '$5',
                placeholder: 'Add a note',
                boc: isNoteTooLong ? '$error' : '$color1',
                bw: 1,
                fontStyle: 'normal',
                minHeight: 40,
                '$theme-dark': {
                  placeholderTextColor: '$silverChalice',
                },
                '$theme-light': {
                  placeholderTextColor: '$darkGrayTextField',
                },
                focusStyle: {
                  boc: isNoteTooLong ? '$error' : '$primary',
                  bw: 1,
                  outlineWidth: 0,
                  fontStyle: 'normal',
                },
                hoverStyle: {
                  boc: isNoteTooLong ? '$error' : '$primary',
                },
                iconAfter: (
                  <Button
                    chromeless
                    unstyled
                    cursor={'pointer'}
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
              note: sendParams.note ?? '',
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
            {({ amount, token, note }) => (
              <YStack gap="$5">
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
                      backgroundColor={isAmountInputFocused ? '$primary' : '$silverChalice'}
                      $theme-light={{
                        backgroundColor: isAmountInputFocused ? '$color12' : '$silverChalice',
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
                                    {formatAmount(formatUnits(coin.balance, coin.decimals), 12, 4)}
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
                <YStack gap={'$2'}>
                  {note}
                  {(isNoteInputFocused || isNoteTooLong) && (
                    <Paragraph
                      color={isNoteTooLong ? '$error' : '$lightGrayTextField'}
                      $theme-light={{ color: '$darkGrayTextField' }}
                    >
                      Max: {MAX_NOTE_LENGTH} characters
                    </Paragraph>
                  )}
                </YStack>
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
