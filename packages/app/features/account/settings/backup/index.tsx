import { Button, H1, H3, H4, H5, Link, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { IconNote } from 'app/components/icons'
import { assert } from 'app/utils/assert'
import { useSendAccounts } from 'app/utils/send-accounts'
import { useLink } from 'solito/link'

export const BackupScreen = () => {
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
      <WebauthnCreds />
    </YStack>
  )
}

const WebauthnCreds = () => {
  const addPasskeyLink = useLink({
    href: '/account/settings/backup/add-passkey',
  })
  const { data: sendAccts, error } = useSendAccounts()

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
      <YStack w={'100%'}>
        {error && (
          <YStack w={'100%'} gap={'$6'}>
            <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
              {error.message}
            </Paragraph>
          </YStack>
        )}
        {sendAccts && sendAccts.length === 0 && (
          <YStack w={'100%'} gap={'$6'}>
            <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
              You have no Webauthn Credentials.
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
                Learn more about Webauthn
              </Paragraph>
            </Link>
          </YStack>
        )}
      </YStack>
      {sendAccts && sendAccts.length > 0 && (
        <YStack w={'100%'} gap={'$6'} pb={'$6'}>
          {sendAccts.map((acct) =>
            acct.send_account_credentials.map((cred, idx) => (
              <>
                <SendAccountCredentials key={`${acct.id}-${cred.key_slot}`} cred={cred} />
                {idx !== acct.send_account_credentials.length - 1 && <Separator w={'100%'} />}
              </>
            ))
          )}
        </YStack>
      )}
    </YStack>
  )
}

const SendAccountCredentials = ({
  cred,
}: {
  cred: NonNullable<
    ReturnType<typeof useSendAccounts>['data']
  >[number]['send_account_credentials'][number]
}) => {
  const webauthnCred = cred.webauthn_credentials
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
    </YStack>
  )
}
