import { useState } from 'react'
import {
  Button,
  H1,
  H4,
  H5,
  Input,
  Link,
  Paragraph,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
  isWeb,
} from '@my/ui'
import { baseMainnetClient, useReadSendAccountGetActiveSigningKeys } from '@my/wagmi'
import { IconDots, IconNote, IconX } from 'app/components/icons'
import { assert } from 'app/utils/assert'
import { formatTimeDate } from 'app/utils/formatTimeDate'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { pgBase16ToBytes } from 'app/utils/pgBase16ToBytes'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useLink } from 'solito/link'

export const BackupScreen = () => {
  const { data: sendAcct, error, isLoading } = useSendAccount()
  const hasSendAccount = !!sendAcct
  return (
    <YStack w={'100%'} als={'center'} gap={'$size.3.5'}>
      <YStack w={'100%'} gap={'$size.2'}>
        <H1
          size={'$8'}
          fontWeight={'300'}
          $theme-dark={{ color: '$lightGrayTextField' }}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Add Passkey as Signer
        </H1>

        <Paragraph
          size={'$5'}
          $theme-dark={{ color: '$lightGrayTextField' }}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Backup your Send Account by add up to 20 passkeys to your account. Passkeys are authorized
          devices that can sign transactions for your account.
        </Paragraph>
      </YStack>

      {(() => {
        switch (true) {
          case error !== null:
            return (
              <YStack w={'100%'} gap={'$6'}>
                <Separator w={'100%'} $theme-dark={{ borderColor: '$decay' }} />
                <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
                  {error.message}
                </Paragraph>
              </YStack>
            )
          case isLoading:
            return <Spinner size="large" color="$color" />
          case !hasSendAccount:
            return (
              <YStack w={'100%'} gap={'$6'}>
                <Separator w={'100%'} $theme-dark={{ borderColor: '$decay' }} />
                <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
                  You have no Send Account.
                </Paragraph>
                <Link
                  href="https://info.send.it/send/mission-vision-and-values"
                  target="_blank"
                  display="flex"
                  alignItems="center"
                  gap="2"
                  color="$color12"
                >
                  <IconNote size="1.5" />
                  <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
                    Learn more about Send Accounts
                  </Paragraph>
                </Link>
              </YStack>
            )
          default:
            return <WebauthnCreds sendAcct={sendAcct} />
        }
      })()}
    </YStack>
  )
}

const WebauthnCreds = ({
  sendAcct,
}: { sendAcct: NonNullable<ReturnType<typeof useSendAccount>['data']> }) => {
  const addPasskeyLink = useLink({
    href: '/account/settings/backup/create',
  })

  return (
    <YStack w={'100%'} gap={'$size.3'}>
      <XStack w={'100%'} gap={'$2'} jc="space-between" ai="center">
        <YStack>
          <Button theme="accent" {...addPasskeyLink}>
            Add Passkey
          </Button>
        </YStack>
      </XStack>

      <Separator w={'100%'} $theme-dark={{ borderColor: '$decay' }} />

      <XStack gap="$5" flexWrap="wrap" ai="flex-start">
        {sendAcct.send_account_credentials.map((cred) => (
          <SendAccountCredentials
            key={`${sendAcct.id}-${cred.key_slot}`}
            address={sendAcct.address}
            cred={cred}
          />
        ))}
      </XStack>
    </YStack>
  )
}

const SendAccountCredentials = ({
  address,
  cred,
}: {
  address: `0x${string}`
  cred: NonNullable<ReturnType<typeof useSendAccount>['data']>['send_account_credentials'][number]
}) => {
  const [cardStatus, setCardStatus] = useState<'default' | 'settings' | 'remove'>('default')
  const webauthnCred = cred.webauthn_credentials
  assert(!!webauthnCred, 'webauthnCred not found')
  const {
    data: activeSigningKeys,
    isLoading: isLoadingActiveSigningKeys,
    error: activeSigningKeysError,
  } = useReadSendAccountGetActiveSigningKeys({
    chainId: baseMainnetClient.chain.id,
    address,
    query: {
      enabled: !!address,
    },
  })
  const [x, y] = COSEECDHAtoXY(pgBase16ToBytes(webauthnCred.public_key as `\\x${string}`))
  const activeIndex = activeSigningKeys?.[0].findIndex(([_x, _y]) => x === _x && y === _y) ?? -1
  const isActive = activeIndex !== -1
  const onchainSlot = activeSigningKeys?.[1][activeIndex]
  const link = useLink({
    href: `/account/settings/backup/confirm/${webauthnCred?.id}`,
  })
  assert(!!webauthnCred, 'webauthnCred not found')
  return (
    <YStack
      w={'100%'}
      gap={'$size.1.5'}
      p={'$size.1.5'}
      $theme-dark={{ backgroundColor: '$darkest' }}
      $theme-light={{ backgroundColor: '$gray2Light' }}
      borderRadius={'$5'}
      $gtLg={{
        width: isWeb ? 'calc((100% - 24px) / 2)' : '100%',
      }}
      $gtXl={{
        width: isWeb ? 'calc((100% - 48px) / 3)' : '100%',
      }}
    >
      <XStack jc="space-between" ai="center">
        <H4 fontWeight={'700'} color={cardStatus === 'remove' ? '$error' : '$primary'}>
          {cardStatus === 'remove' ? 'Remove Passkey?' : webauthnCred.display_name}
        </H4>
        {cardStatus !== 'remove' && (
          <Button
            chromeless
            px={'0'}
            borderRadius={'$1'}
            height={'$size.1.5'}
            width={'$size.1.5'}
            onPress={() => setCardStatus(cardStatus === 'default' ? 'settings' : 'default')}
          >
            {cardStatus === 'default' ? <IconDots color={'$primary'} /> : <IconX />}
          </Button>
        )}
      </XStack>

      {(() => {
        switch (cardStatus) {
          case 'settings':
            return (
              <Button
                borderColor={'$error'}
                color={'$error'}
                variant="outlined"
                mt={'$size.0.9'}
                hoverStyle={{ borderColor: '$error' }}
                onPress={() => setCardStatus('remove')}
              >
                REMOVE PASSKEY
              </Button>
            )
          case 'remove':
            return (
              <RemovePasskeyConfirmation
                name={webauthnCred.display_name}
                onCancel={() => setCardStatus('default')}
                onRemove={() => {
                  throw new Error('`onRemove` has not been implemented')
                }}
              />
            )
          default:
            return (
              <>
                {cred.created_at && (
                  <CardTextBlock label="Created At" text={formatTimeDate(cred.created_at)} />
                )}

                <CardTextBlock label="Key Slot" text={cred.key_slot.toString().padStart(2, '0')} />

                {(() => {
                  switch (true) {
                    case isLoadingActiveSigningKeys:
                      return <Spinner size="small" />
                    case activeSigningKeysError !== null:
                      return (
                        <Paragraph
                          maxWidth={'600'}
                          fontFamily={'$mono'}
                          fontSize={'$5'}
                          color={'$color12'}
                        >
                          {activeSigningKeysError?.message ??
                            `Something went wrong: ${
                              activeSigningKeysError?.message.split('.').at(0) ??
                              'Something went wrong'
                            }`}
                        </Paragraph>
                      )
                    case !isActive:
                      return (
                        <YStack gap={'$size.1.5'} ai="flex-start">
                          <CardTextBlock
                            label="Status"
                            text="Passkey is not confirmed onchain. Finish confirming the passkey onchain."
                            warningText
                          />
                          <Button theme={'accent'} color="$primary" variant="outlined" {...link}>
                            CONFIRM
                          </Button>
                        </YStack>
                      )
                    case onchainSlot !== cred.key_slot:
                      return (
                        <Paragraph fontWeight={'300'} color={'$yellowVibrant'} fontFamily={'$mono'}>
                          Onchain Slot: {onchainSlot} does not match Webauthn Slot: {cred.key_slot}.
                          This should never happen.
                        </Paragraph>
                      )
                    default:
                      return <></>
                  }
                })()}
              </>
            )
        }
      })()}
    </YStack>
  )
}

const CardTextBlock = ({
  label,
  text,
  warningText = false,
}: { label: string; text: string; warningText?: boolean }) => {
  return (
    <YStack gap={'$size.0.5'}>
      <H5
        size={'$5'}
        $theme-dark={{ color: '$lightGrayTextField' }}
        $theme-light={{ color: '$darkGrayTextField' }}
        fontWeight={'400'}
      >
        {label}
      </H5>
      <Paragraph
        fontWeight={'300'}
        size={'$5'}
        $theme-dark={{ color: warningText ? '$error' : '$white' }}
        $theme-light={{ color: warningText ? '$error' : '$black' }}
        fontFamily={'$mono'}
      >
        {text}
      </Paragraph>
    </YStack>
  )
}

const RemovePasskeyConfirmation = ({
  name,
  onCancel,
  onRemove,
}: {
  name: string
  onCancel: () => void
  onRemove: () => void
}) => {
  const [inputVal, setInputVal] = useState('')

  return (
    <YStack gap={'$size.3.5'}>
      <Text
        fontWeight={'400'}
        fontSize={'$5'}
        $theme-dark={{ color: '$white' }}
        $theme-light={{ color: '$black' }}
        fontFamily={'$mono'}
      >
        Removing &quot;{name}&quot; as a signer on your Send account.{' '}
        <Text
          fontWeight={'400'}
          fontSize={'$5'}
          $theme-dark={{ color: '$warning' }}
          $theme-light={{ color: '$yellow300' }}
          fontFamily={'$mono'}
        >
          This cannot be undone.
        </Text>
      </Text>

      <YStack gap={'$size.1.5'}>
        <Text
          fontWeight={'400'}
          fontSize={'$5'}
          $theme-dark={{ color: '$white' }}
          $theme-light={{ color: '$black' }}
          fontFamily={'$mono'}
        >
          Please enter &quot;{name}&quot; below
        </Text>

        <Input
          boc={'transparent'}
          borderRadius={'$4'}
          $theme-dark={{ color: '$white' }}
          $theme-light={{ color: '$black' }}
          ff={'$mono'}
          autoFocus
          onChangeText={setInputVal}
        />

        <XStack gap="$size.1" jc="space-between" w={'100%'} pt={'$size.0.9'}>
          <Button
            borderColor={'$primary'}
            color={'$primary'}
            variant="outlined"
            flex={1}
            hoverStyle={{ borderColor: '$primary' }}
            onPress={onCancel}
          >
            CANCEL
          </Button>
          <Button
            borderColor={'$error'}
            color={'$error'}
            variant="outlined"
            flex={1}
            hoverStyle={{ borderColor: '$error' }}
            onPress={onRemove}
            disabledStyle={{ opacity: 0.5 }}
            disabled={name !== inputVal}
          >
            REMOVE
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}
