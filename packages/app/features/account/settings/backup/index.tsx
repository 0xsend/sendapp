import { Button, H1, H3, H4, H5, Link, Paragraph, Separator, Spinner, XStack, YStack } from '@my/ui'
import { baseMainnetClient, useReadSendAccountGetActiveSigningKeys } from '@my/wagmi'
import { IconNote } from 'app/components/icons'
import { assert } from 'app/utils/assert'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { pgBase16ToBytes } from 'app/utils/pgBase16ToBytes'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useLink } from 'solito/link'

export const BackupScreen = () => {
  const { data: sendAcct, error, isLoading } = useSendAccount()
  const hasSendAccount = !!sendAcct
  return (
    <YStack w={'100%'} als={'center'} gap={'$6'}>
      <YStack w={'100%'} gap={'$2'}>
        <H1 size={'$8'} fontWeight={'300'} color={'$color05'}>
          Backup Send Account
        </H1>
        <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
          Backup your Send Account by add up to 20 passkeys to your account. Passkeys are authorized
          devices that can sign transactions for your account.
        </Paragraph>
      </YStack>
      <Separator w={'100%'} />
      {(() => {
        switch (true) {
          case error !== null:
            return (
              <YStack w={'100%'} gap={'$6'}>
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
    <YStack w={'100%'} gap={'$2'}>
      <XStack w={'100%'} gap={'$2'} jc="space-between" ai="center">
        <H3 size={'$6'} fontWeight={'300'} color={'$color05'}>
          Passkeys
        </H3>
        <YStack>
          <Button theme="accent" {...addPasskeyLink}>
            Add Passkey
          </Button>
        </YStack>
      </XStack>
      <YStack w={'100%'} gap={'$6'} pb={'$6'}>
        {sendAcct.send_account_credentials.map((cred, idx) => (
          <YStack key={`${sendAcct.id}-${cred.key_slot}`} w={'100%'} gap={'$2'}>
            <SendAccountCredentials address={sendAcct.address} cred={cred} />
            {idx !== sendAcct.send_account_credentials.length - 1 && <Separator w={'100%'} />}
          </YStack>
        ))}
      </YStack>
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
    <YStack w={'100%'} gap={'$3'} mt={'$2'} mb={'$2'}>
      <H4 fontWeight={'300'} color={'$color05'}>
        {webauthnCred.display_name}
      </H4>
      <H5 fontWeight={'300'} color={'$color05'}>
        Created At
      </H5>
      <Paragraph fontWeight={'300'} color={'$color05'} fontFamily={'$mono'}>
        {cred.created_at}
      </Paragraph>
      <H5 fontWeight={'300'} color={'$color05'}>
        Key Slot
      </H5>
      <Paragraph fontWeight={'300'} color={'$color05'} fontFamily={'$mono'}>
        {cred.key_slot}
      </Paragraph>
      {(() => {
        switch (true) {
          case isLoadingActiveSigningKeys:
            return <Spinner size="small" />
          case activeSigningKeysError !== null:
            return (
              <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
                {activeSigningKeysError?.message ??
                  `Something went wrong: ${activeSigningKeysError}`}
              </Paragraph>
            )
          case !isActive:
            return (
              <>
                <Paragraph fontWeight={'300'} color={'$yellowVibrant'} fontFamily={'$mono'}>
                  Passkey is not confirmed onchain. Finish confirming the passkey onchain.
                </Paragraph>
                <Button theme="warning" {...link}>
                  Confirm
                </Button>
              </>
            )
          case onchainSlot !== cred.key_slot:
            return (
              <Paragraph fontWeight={'300'} color={'$yellowVibrant'} fontFamily={'$mono'}>
                Onchain Slot: {onchainSlot} does not match Webauthn Slot: {cred.key_slot}. This
                should never happen.
              </Paragraph>
            )
          default:
            return <></>
        }
      })()}
    </YStack>
  )
}
